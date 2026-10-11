import { ViajeNacionalModel, ViajeInternacionalModel } from '../viajes/viajes.model';
import { NotificationModel } from './notifications.model';
import { listRules } from './notifications.rules';
import { queueMobileDeliveries } from './notifications.delivery';

// Events live in the same document write as the trip state. A retry drains them
// without losing the change if notification creation or mobile queuing fails.
export async function drainTripEvents() {
    const rule = (await listRules()).find(rule => rule.type === 'VIAJE_ESTADO' && rule.active);
    for (const [tipo, model] of [['nacional', ViajeNacionalModel], ['internacional', ViajeInternacionalModel]] as const) {
        const trips = await model.find({ 'notificationEvents.0': { $exists: true } }).select('+notificationEvents');
        for (const trip of trips) {
            for (const event of trip.notificationEvents || []) {
                if (rule) {
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
