import { NotificationRepository } from './notifications.repository';
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
    async getNotifications(userId: string, role?: string) {
        // 1. Run checks to generate new notifications based on current data
        await this.checkExpirations();

        // 2. Return persistent notifications for the user
        return await this.notificationRepo.findByUserOrRole(userId, role);
    }

    async markAsRead(id: string) {
        return await this.notificationRepo.markAsRead(id);
    }

    async clearAll(userId: string, role?: string) {
        return await this.notificationRepo.deleteForAll(userId, role);
    }

    // Logic to check all entities and create notifications if needed
    private async checkExpirations() {
        const today = new Date();
        const fourMonthsInMs = 120 * 24 * 60 * 60 * 1000;

        // --- Helper for Date Checks ---
        const processEntity = async (
            entityId: string,
            dateStr: Date | string,
            entityName: string,
            type: 'LICENCIA' | 'SEGURO',
            link: string
        ) => {
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
                
                // Check if already exists to avoid spamming
                const existing = await this.notificationRepo.findExisting(notifType, resourceId);
                if (!existing) {
                    await this.notificationRepo.create({
                        type: notifType,
                        resourceId,
                        title: `${type === 'LICENCIA' ? 'Licencia' : 'Seguro'} por vencer`,
                        message: `${entityName} vence en ${daysDiff} días`,
                        severity,
                        link,
                        role: 'admin' // Default to admin or operator
                    });
                }
            }
        };

        // 1. Choferes (Licencias)
        const choferes = await ChoferModel.find();
        for (const c of choferes) {
            await processEntity(c._id.toString(), c.licencia_vencimiento || c.licencia || '', c.nombre, 'LICENCIA', '/dashboard/choferes');
        }

        // 2. Camiones (Seguros)
        const camiones = await CamionModel.find();
        for (const c of camiones) {
             await processEntity(c._id.toString(), c.vencimiento_seguro || '', `Camión ${c.patente}`, 'SEGURO', '/dashboard/flota');
        }

        // 3. Semis (Seguros)
        const semis = await SemirremolqueModel.find();
        for (const s of semis) {
             await processEntity(s._id.toString(), s.vencimiento_seguro || '', `Semi ${s.patente}`, 'SEGURO', '/dashboard/flota');
        }

        // 4. Facturación (Cobranzas/Pagos)
        const processFactura = async (f: any, typeName: string, link: string) => {
             const fechaEmision = new Date(f.fecha);
            const plazo = f.plazo || 30;
            const fechaVencimiento = new Date(fechaEmision);
            fechaVencimiento.setDate(fechaEmision.getDate() + plazo);

            const diffTime = fechaVencimiento.getTime() - today.getTime();
            const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysDiff <= 5) {
                let severity: 'info' | 'warning' | 'danger' = 'warning';
                let label = 'Por vencer';
                
                if (daysDiff < 0) {
                    severity = 'danger';
                    label = 'Vencido';
                }

                const type = typeName.includes('Cobranza') ? 'COBRANZA' : 'PAGO';
                const resourceId = `FACT-${f._id}`;
                
                const existing = await this.notificationRepo.findExisting(type, resourceId);
                if (!existing) {
                     await this.notificationRepo.create({
                        type,
                        resourceId,
                        title: `${type} ${label}`,
                        message: `${f.razon_social} - ${daysDiff < 0 ? 'Vencido hace ' + Math.abs(daysDiff) + ' días' : 'Vence en ' + daysDiff + ' días'}`,
                        severity,
                        link,
                        role: 'admin' // Financial alerts
                    });
                }
            }
        };

        const cobNac = await CobranzaNacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
        for (const f of cobNac) await processFactura(f, 'Cobranza Nac.', '/dashboard/facturacion/cobranzas');

        const cobInt = await CobranzaInternacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
        for (const f of cobInt) await processFactura(f, 'Cobranza Int.', '/dashboard/facturacion/cobranzas');

        const pagNac = await PagoNacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
        for (const f of pagNac) await processFactura(f, 'Pago Nac.', '/dashboard/facturacion/pagos');

        const pagInt = await PagoInternacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
        for (const f of pagInt) await processFactura(f, 'Pago Int.', '/dashboard/facturacion/pagos');
    }
}
