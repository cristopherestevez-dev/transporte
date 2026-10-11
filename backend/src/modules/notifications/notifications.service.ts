import { NotificationRepository } from './notifications.repository';
import { drainTripEvents } from './notifications.events';
import { queueMobileDeliveries } from './notifications.delivery';
import { listRules } from './notifications.rules';
// Import repositories/models directly to check for expirations
import { ChoferModel } from '../choferes/choferes.model';
import { CamionModel } from '../camiones/camiones.model';
import { SemirremolqueModel } from '../semirremolques/semirremolques.model';
import { 
    CobranzaNacionalModel, 
    CobranzaInternacionalModel, 
    PagoNacionalModel, 
    PagoInternacionalModel 
} from '../facturacion/facturacion.model';

export class NotificationService {
    private notificationRepo: NotificationRepository;

    constructor() {
        this.notificationRepo = new NotificationRepository();
    }

    // Main method to generate and retrieve notifications
    async getNotifications(userId: string, permissions: string[]) {
        await drainTripEvents();
        // 1. Run checks to generate new notifications based on current data
        await this.checkExpirations();

        // 2. Return persistent notifications for the user
        return await this.notificationRepo.findByUserOrRole(userId, permissions);
    }

    async markAsRead(id: string, userId: string, permissions: string[]) {
        return await this.notificationRepo.markAsRead(id, userId, permissions);
    }

    async clearAll(userId: string, permissions: string[]) {
        return await this.notificationRepo.deleteForAll(userId, permissions);
    }

    // Logic to check all entities and create notifications if needed
    private async checkExpirations() {
        const rules = await listRules();
        const today = new Date();
        const activeResourceIds = new Set<string>();

        // --- Helper for Date Checks ---
        const processEntity = async (
            entityId: string,
            dateStr: Date | string,
            entityName: string,
            type: 'LICENCIA' | 'SEGURO',
            link: string
        ) => {
            if (!rules.some(rule => rule.type === type && rule.active)) return;
            if (!dateStr) return;
            const expDate = new Date(dateStr);
            const diffTime = expDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysDiff <= 120) {
                let severity: 'info' | 'warning' | 'danger' = 'info';
                if (daysDiff <= 60) severity = 'danger';
                else if (daysDiff <= 90) severity = 'warning';

                const notifType = type;
                const resourceId = `${type}-${entityId}`;
                activeResourceIds.add(resourceId);
                
                // Check if already exists to avoid spamming
                const existing = await this.notificationRepo.findExisting(notifType, resourceId);
                const message = `${entityName} vence en ${daysDiff} días`;
                if (!existing) {
                    const notification = await this.notificationRepo.create({
                        type: notifType,
                        resourceId,
                        title: `${type === 'LICENCIA' ? 'Licencia' : 'Seguro'} por vencer`,
                        message,
                        severity,
                        link,
                        role: 'admin' // Default to admin or operator
                    });
                    await queueMobileDeliveries(notification);
                } else {
                    let changed = false;
                    if (existing.link !== link) { existing.link = link; changed = true; }
                    if (existing.message !== message) {
                        existing.message = message;
                        changed = true;
                    }
                    if (existing.severity !== severity) {
                        existing.severity = severity;
                        changed = true;
                    }
                    if (changed) {
                        await (existing as any).save();
                    }
                    await queueMobileDeliveries(existing);
                }
            }
        };

        // 1. Choferes (Licencias)
        const choferes = await ChoferModel.find();
        for (const c of choferes) {
            await processEntity(c._id.toString(), c.licencia || '', c.nombre, 'LICENCIA', `/choferes/${c._id}`);
        }

        // 2. Camiones (Seguros)
        const camiones = await CamionModel.find();
        for (const c of camiones) {
             await processEntity(c._id.toString(), c.vencimiento_seguro || '', `Camión ${c.patente}`, 'SEGURO', `/camiones/${c._id}`);
        }

        // 3. Semis (Seguros)
        const semis = await SemirremolqueModel.find();
        for (const s of semis) {
             await processEntity(s._id.toString(), s.vencimiento_seguro || '', `Semi ${s.patente}`, 'SEGURO', '/camiones?tab=semirremolques');
        }

        // 4. Facturación (Cobranzas/Pagos)
        const processFactura = async (f: any, typeName: string, link: string) => {
             const fechaEmision = new Date(f.fecha);
             const plazo = f.plazo ?? 30;
             const fechaVencimiento = new Date(fechaEmision);
             fechaVencimiento.setDate(fechaEmision.getDate() + plazo);

             const diffTime = fechaVencimiento.getTime() - today.getTime();
             const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

             if (diffTime <= 5 * 24 * 60 * 60 * 1000) {
                 let severity: 'info' | 'warning' | 'danger' = 'warning';
                 let label = 'Por vencer';
                 
                 if (diffTime < 0) {
                     severity = 'danger';
                     label = 'Vencido';
                 }

                 const type = typeName.includes('Cobranza') ? 'COBRANZA' : 'PAGO';
                 if (!rules.some(rule => rule.type === type && rule.active)) return;
                 const resourceId = `FACT-${f._id}`;
                 activeResourceIds.add(resourceId);
                 
                 const existing = await this.notificationRepo.findExisting(type, resourceId);
                 const daysPassed = Math.abs(daysDiff);
                 const message = `${f.razon_social} - ${daysDiff < 0 ? 'Vencido hace ' + daysPassed + ' días' : 'Vence en ' + daysDiff + ' días'}`;
                 
                 if (!existing) {
                      const notification = await this.notificationRepo.create({
                         type,
                         resourceId,
                         title: `${type} ${label}`,
                         message,
                         severity,
                         link,
                         role: 'admin' // Financial alerts
                     });
                      await queueMobileDeliveries(notification);
                 } else {
                     let changed = false;
                     if (existing.link !== link) { existing.link = link; changed = true; }
                     if (existing.message !== message) {
                         existing.message = message;
                         changed = true;
                     }
                     if (existing.severity !== severity) {
                         existing.severity = severity;
                         changed = true;
                     }
                     if (changed) {
                         await (existing as any).save();
                     }
                     await queueMobileDeliveries(existing);
                 }
             }
         };

        const cobNac = await CobranzaNacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
        for (const f of cobNac) await processFactura(f, 'Cobranza Nac.', '/facturacion?tab=cobranzas&ambito=nacional');

        const cobInt = await CobranzaInternacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
        for (const f of cobInt) await processFactura(f, 'Cobranza Int.', '/facturacion?tab=cobranzas&ambito=internacional');

        const pagNac = await PagoNacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
        for (const f of pagNac) await processFactura(f, 'Pago Nac.', '/facturacion?tab=pagos&ambito=nacional');

        const pagInt = await PagoInternacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
        for (const f of pagInt) await processFactura(f, 'Pago Int.', '/facturacion?tab=pagos&ambito=internacional');

        // 5. Borrar notificaciones que ya no expiran ni están vencidas (seguro renovado, factura cobrada, etc.)
        const types = ['LICENCIA', 'SEGURO', 'COBRANZA', 'PAGO'];
        await this.notificationRepo.deleteInactive(types, Array.from(activeResourceIds));
    }
}
