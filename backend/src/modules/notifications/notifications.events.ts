import { createHash } from 'node:crypto';
import { Usuario } from '../usuarios/usuarios.model';
import { ViajeNacionalModel, ViajeInternacionalModel } from '../viajes/viajes.model';
import { NotificationModel } from './notifications.model';
import { companyScope, listRules } from './notifications.rules';
import { queueMobileDeliveries } from './notifications.delivery';

// Events live in the same document write as the trip state. A retry drains them
// without losing the change if notification creation or mobile queuing fails.
export async function drainTripEvents() {
    const empresaId = companyScope();
    const rules = await listRules();
    const statusEnabled = rules.some(rule => rule.type === 'VIAJE_ESTADO' && rule.active);
    const assignmentEnabled = rules.some(rule => rule.type === 'VIAJE_ASIGNADO' && rule.active);
    for (const [tipo, model] of [['nacional', ViajeNacionalModel], ['internacional', ViajeInternacionalModel]] as const) {
        const trips = await model.find({ 'notificationEvents.0': { $exists: true } }).select('+notificationEvents');
        for (const trip of trips) {
            for (const event of trip.notificationEvents || []) {
                if (event.driverId) {
                    if (assignmentEnabled && trip.tipoAsignacion === 'chofer' && trip.asignadoId === event.driverId) {
                        const users = await Usuario.find({ empresaId, choferId: event.driverId, activo: true, estado: 'aprobado' }).select('_id').lean();
                        for (const user of users) {
                            const userId = user._id.toString();
                            const notificationId = createHash('sha256').update(event.eventId + ':' + userId).digest('hex').slice(0, 24);
                            const notification = await NotificationModel.findOneAndUpdate({ _id: notificationId }, { $setOnInsert: {
                                userId, type: 'VIAJE_ASIGNADO', title: 'Nuevo viaje asignado',
                                message: `${trip.origen} → ${trip.destino}${trip.fecha_salida ? ' · ' + trip.fecha_salida.slice(0, 10) : ''}`,
                                resourceId: trip._id.toString(), link: '/mis-viajes', severity: 'info', createdAt: event.createdAt,
                            } }, { new: true, upsert: true });
                            await queueMobileDeliveries(notification!);
                        }
                    }
                } else if (statusEnabled) {
                    const notification = await NotificationModel.findOneAndUpdate({ _id: event.eventId }, { $setOnInsert: {
                        type: 'VIAJE_ESTADO', title: 'Cambio de estado de viaje',
                        message: `${trip.origen} → ${trip.destino}: ${event.previous} → ${event.current}`,
                        resourceId: trip._id.toString(), link: `/viajes/${tipo}/${trip._id}`, severity: 'info', createdAt: event.createdAt,
                    } }, { new: true, upsert: true });
                    await queueMobileDeliveries(notification!);
                }
                await model.updateOne({ _id: trip._id }, { $pull: { notificationEvents: { eventId: event.eventId } } });
            }
        }
    }
}
