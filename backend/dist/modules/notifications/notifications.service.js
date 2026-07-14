"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notifications_repository_1 = require("./notifications.repository");
// Import repositories/models directly to check for expirations
const choferes_model_1 = require("../choferes/choferes.model");
const camiones_model_1 = require("../camiones/camiones.model");
const semirremolques_model_1 = require("../semirremolques/semirremolques.model");
const facturacion_model_1 = require("../facturacion/facturacion.model");
class NotificationService {
    constructor() {
        this.notificationRepo = new notifications_repository_1.NotificationRepository();
    }
    // Main method to generate and retrieve notifications
    getNotifications(userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Run checks to generate new notifications based on current data
            yield this.checkExpirations();
            // 2. Return persistent notifications for the user
            return yield this.notificationRepo.findByUserOrRole(userId, role);
        });
    }
    markAsRead(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.notificationRepo.markAsRead(id);
        });
    }
    clearAll(userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.notificationRepo.deleteForAll(userId, role);
        });
    }
    // Logic to check all entities and create notifications if needed
    checkExpirations() {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date();
            const activeResourceIds = new Set();
            // --- Helper for Date Checks ---
            const processEntity = (entityId, dateStr, entityName, type, link) => __awaiter(this, void 0, void 0, function* () {
                if (!dateStr)
                    return;
                const expDate = new Date(dateStr);
                const diffTime = expDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (daysDiff <= 120) {
                    let severity = 'info';
                    if (daysDiff <= 60)
                        severity = 'danger';
                    else if (daysDiff <= 90)
                        severity = 'warning';
                    const notifType = type;
                    const resourceId = `${type}-${entityId}`;
                    activeResourceIds.add(resourceId);
                    // Check if already exists to avoid spamming
                    const existing = yield this.notificationRepo.findExisting(notifType, resourceId);
                    const message = `${entityName} vence en ${daysDiff} días`;
                    if (!existing) {
                        yield this.notificationRepo.create({
                            type: notifType,
                            resourceId,
                            title: `${type === 'LICENCIA' ? 'Licencia' : 'Seguro'} por vencer`,
                            message,
                            severity,
                            link,
                            role: 'admin' // Default to admin or operator
                        });
                    }
                    else {
                        let changed = false;
                        if (existing.message !== message) {
                            existing.message = message;
                            changed = true;
                        }
                        if (existing.severity !== severity) {
                            existing.severity = severity;
                            changed = true;
                        }
                        if (changed) {
                            yield existing.save();
                        }
                    }
                }
            });
            // 1. Choferes (Licencias)
            const choferes = yield choferes_model_1.ChoferModel.find();
            for (const c of choferes) {
                yield processEntity(c._id.toString(), c.licencia || '', c.nombre, 'LICENCIA', '/dashboard/choferes');
            }
            // 2. Camiones (Seguros)
            const camiones = yield camiones_model_1.CamionModel.find();
            for (const c of camiones) {
                yield processEntity(c._id.toString(), c.vencimiento_seguro || '', `Camión ${c.patente}`, 'SEGURO', '/dashboard/flota');
            }
            // 3. Semis (Seguros)
            const semis = yield semirremolques_model_1.SemirremolqueModel.find();
            for (const s of semis) {
                yield processEntity(s._id.toString(), s.vencimiento_seguro || '', `Semi ${s.patente}`, 'SEGURO', '/dashboard/flota');
            }
            // 4. Facturación (Cobranzas/Pagos)
            const processFactura = (f, typeName, link) => __awaiter(this, void 0, void 0, function* () {
                const fechaEmision = new Date(f.fecha);
                const plazo = f.plazo || 30;
                const fechaVencimiento = new Date(fechaEmision);
                fechaVencimiento.setDate(fechaEmision.getDate() + plazo);
                const diffTime = fechaVencimiento.getTime() - today.getTime();
                const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffTime <= 5 * 24 * 60 * 60 * 1000) {
                    let severity = 'warning';
                    let label = 'Por vencer';
                    if (diffTime < 0) {
                        severity = 'danger';
                        label = 'Vencido';
                    }
                    const type = typeName.includes('Cobranza') ? 'COBRANZA' : 'PAGO';
                    const resourceId = `FACT-${f._id}`;
                    activeResourceIds.add(resourceId);
                    const existing = yield this.notificationRepo.findExisting(type, resourceId);
                    const daysPassed = Math.abs(daysDiff);
                    const message = `${f.razon_social} - ${daysDiff < 0 ? 'Vencido hace ' + daysPassed + ' días' : 'Vence en ' + daysDiff + ' días'}`;
                    if (!existing) {
                        yield this.notificationRepo.create({
                            type,
                            resourceId,
                            title: `${type} ${label}`,
                            message,
                            severity,
                            link,
                            role: 'admin' // Financial alerts
                        });
                    }
                    else {
                        let changed = false;
                        if (existing.message !== message) {
                            existing.message = message;
                            changed = true;
                        }
                        if (existing.severity !== severity) {
                            existing.severity = severity;
                            changed = true;
                        }
                        if (changed) {
                            yield existing.save();
                        }
                    }
                }
            });
            const cobNac = yield facturacion_model_1.CobranzaNacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
            for (const f of cobNac)
                yield processFactura(f, 'Cobranza Nac.', '/dashboard/facturacion/cobranzas');
            const cobInt = yield facturacion_model_1.CobranzaInternacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
            for (const f of cobInt)
                yield processFactura(f, 'Cobranza Int.', '/dashboard/facturacion/cobranzas');
            const pagNac = yield facturacion_model_1.PagoNacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
            for (const f of pagNac)
                yield processFactura(f, 'Pago Nac.', '/dashboard/facturacion/pagos');
            const pagInt = yield facturacion_model_1.PagoInternacionalModel.find({ estado: { $nin: ['pagado', 'cobrado'] } });
            for (const f of pagInt)
                yield processFactura(f, 'Pago Int.', '/dashboard/facturacion/pagos');
            // 5. Borrar notificaciones que ya no expiran ni están vencidas (seguro renovado, factura cobrada, etc.)
            const types = ['LICENCIA', 'SEGURO', 'COBRANZA', 'PAGO'];
            yield this.notificationRepo.deleteInactive(types, Array.from(activeResourceIds));
        });
    }
}
exports.NotificationService = NotificationService;
