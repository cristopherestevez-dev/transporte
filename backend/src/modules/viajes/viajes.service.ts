import { ViajesRepository, viajesNacionalesRepository, viajesInternacionalesRepository } from './viajes.repository';
import { IViaje } from './viajes.model';
import { Usuario, perfilesAsignados } from '../usuarios/usuarios.model';
import { tenantContext } from '../../shared/tenant';
import { AppError } from '../../shared/errors/AppError';
import { drainTripEvents } from '../notifications/notifications.events';
import { logger } from '../../config/logger';

import { CamionModel } from '../camiones/camiones.model';
import { ChoferModel } from '../choferes/choferes.model';
import { SemirremolqueModel } from '../semirremolques/semirremolques.model';
import { CargaCombustibleInput } from './viajes.combustible';

import { mesActual, Planilla } from '../choferes/planillas.routes';

export class ViajesService {
    async getFuelTrucks() {
        return CamionModel.find().select('patente').sort({ patente: 1 }).lean();
    }

    async getOperators() {
        const empresaId = tenantContext.getStore()?.empresaId;
        if (!empresaId) throw new AppError('Seleccioná una empresa operadora', 403);
        const users = await Usuario.find({ empresaId, activo: true, estado: 'aprobado' })
            .select('nombre email perfil perfiles').sort({ nombre: 1 }).lean();
        return users.filter(user => perfilesAsignados(user).includes('operador_logistico'))
            .map(user => ({ id: user._id.toString(), nombre: user.nombre || user.email }));
    }

    private async validateOperator(id?: string) {
        if (id && !(await this.getOperators()).some(user => user.id === id)) {
            throw new AppError('Seleccioná un operador logístico activo de tu empresa', 400);
        }
    }

    async getFleet() {
        const [camiones, semirremolques] = await Promise.all([
            this.getFuelTrucks(),
            SemirremolqueModel.find().select('patente').sort({ patente: 1 }).lean(),
        ]);
        return { camiones, semirremolques };
    }

    private async vehicleAssignment(data: Partial<IViaje>, previous?: IViaje): Promise<Partial<IViaje>> {
        const updates: Partial<IViaje> = {};
        const tipo = data.tipoAsignacion ?? previous?.tipoAsignacion;
        const asignadoId = data.asignadoId ?? previous?.asignadoId;

        if (!previous || tipo !== previous.tipoAsignacion || asignadoId !== previous.asignadoId || (data.asignadoId !== undefined && previous.camionId === undefined)) {
            const driver = tipo === 'chofer' && asignadoId && /^[a-f0-9]{24}$/i.test(asignadoId)
                ? await ChoferModel.findById(asignadoId).select('camionId').lean()
                : null;
            const truck = driver?.camionId
                ? await CamionModel.findById(driver.camionId).select('patente').lean()
                : null;
            updates.camionId = truck?._id.toString() ?? '';
            updates.camionPatente = truck?.patente ?? '';
        }

        if (data.semirremolqueId !== undefined && data.semirremolqueId !== previous?.semirremolqueId) {
            const trailer = data.semirremolqueId
                ? await SemirremolqueModel.findById(data.semirremolqueId).select('patente').lean()
                : null;
            if (data.semirremolqueId && !trailer) throw new AppError('Semirremolque no encontrado en tu empresa', 400);
            updates.semirremolqueId = trailer?._id.toString() ?? '';
            updates.semirremolquePatente = trailer?.patente ?? '';
        }

        return updates;
    }

    async addFuel(id: string, carga: CargaCombustibleInput): Promise<IViaje> {
        const viaje = await this.getById(id);
        const existing = viaje.cargasCombustible?.find(row => row.registroId === carga.registroId);
        if (existing) {
            if (existing.camionId !== carga.camionId || existing.importe !== carga.importe ||
                existing.moneda !== carga.moneda || existing.fecha !== carga.fecha) {
                throw new AppError('El identificador ya corresponde a otra carga de combustible', 409);
            }
            return viaje;
        }

        const camion = await CamionModel.findById(carga.camionId).select('patente').lean();
        if (!camion) throw new AppError('Camión no encontrado', 404);
        const updated = await this.repository.addFuel(id, { ...carga, patente: camion.patente });
        if (updated) return updated;

        const current = await this.getById(id);
        const saved = current.cargasCombustible?.find(row => row.registroId === carga.registroId);
        if (saved && saved.camionId === carga.camionId && saved.importe === carga.importe &&
            saved.moneda === carga.moneda && saved.fecha === carga.fecha) return current;
        throw new AppError('El identificador ya corresponde a otra carga de combustible', 409);
    }

    private repository: ViajesRepository;
    private tipo: string;

    constructor(tipo: 'nacional' | 'internacional') {
        this.tipo = tipo;
        this.repository = tipo === 'nacional' ? viajesNacionalesRepository : viajesInternacionalesRepository;
    }

    async getAll(): Promise<IViaje[]> {
        return this.repository.findAll();
    }

    async getById(id: string): Promise<IViaje> {
        const viaje = await this.repository.findById(id);
        if (!viaje) {
            throw new AppError(`Viaje ${this.tipo} no encontrado`, 404);
        }
        return viaje;
    }

    private async verificarPlanillaAbierta(tipo?: string, choferId?: string, mes?: string) {
        const empresaId = tenantContext.getStore()?.empresaId;
        if (empresaId && tipo === 'chofer' && choferId && mes
            && await Planilla.exists({ empresaId, choferId, mes })) {
            throw new AppError('La planilla de ese mes está cerrada. Elegí otro mes para el viaje.', 409);
        }
    }

    async create(data: Partial<IViaje>): Promise<IViaje> {
        await this.validateOperator(data.operadorLogisticoId);
        const mesPlanilla = data.mesPlanilla ?? mesActual();
        await this.verificarPlanillaAbierta(data.tipoAsignacion, data.asignadoId, mesPlanilla);
        const viaje = await this.repository.create({ ...data, mesPlanilla, ...await this.vehicleAssignment(data) });
        if (data.tipoAsignacion === 'chofer' && data.asignadoId) await this.deliverNotifications();
        return viaje;
    }

    async update(id: string, data: Partial<IViaje>): Promise<IViaje> {
        if (data.operadorLogisticoId !== undefined) {
            const trip = await this.getById(id);
            if (trip.operadorLogisticoId !== data.operadorLogisticoId) await this.validateOperator(data.operadorLogisticoId);
        }
        const changesVehicles = data.tipoAsignacion !== undefined || data.asignadoId !== undefined || data.semirremolqueId !== undefined;
        const previous = changesVehicles || data.mesPlanilla !== undefined || data.fecha_salida !== undefined ? await this.getById(id) : undefined;
        if (previous) {
            const tipo = data.tipoAsignacion ?? previous.tipoAsignacion;
            const choferId = data.asignadoId ?? previous.asignadoId;
            const mesAnterior = previous.mesPlanilla || previous.fecha_salida?.slice(0, 7);
            const mes = data.mesPlanilla ?? (previous.mesPlanilla || (data.fecha_salida ?? previous.fecha_salida)?.slice(0, 7));
            if (tipo !== previous.tipoAsignacion || choferId !== previous.asignadoId || mes !== mesAnterior) {
                await this.verificarPlanillaAbierta(tipo, choferId, mes);
            }
        }
        const vehicles = previous ? await this.vehicleAssignment(data, previous) : {};
        const viaje = await this.repository.update(id, { ...data, ...vehicles }, previous);
        if (!viaje) {
            throw new AppError(`Viaje ${this.tipo} no encontrado`, 404);
        }
        if (data.estado || data.tipoAsignacion !== undefined || data.asignadoId !== undefined) await this.deliverNotifications();
        return viaje;
    }

    private async deliverNotifications() {
        try { await drainTripEvents(); }
        catch (error) { logger.error('Entrega de notificación pendiente; se reintentará', error); }
    }

    async delete(id: string): Promise<void> {
        const viaje = await this.repository.delete(id);
        if (!viaje) {
            throw new AppError(`Viaje ${this.tipo} no encontrado`, 404);
        }
    }

    async count(): Promise<number> {
        return this.repository.count();
    }
}

export const viajesNacionalesService = new ViajesService('nacional');
export const viajesInternacionalesService = new ViajesService('internacional');
