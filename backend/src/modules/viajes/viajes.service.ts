import { ViajesRepository, viajesNacionalesRepository, viajesInternacionalesRepository } from './viajes.repository';
import { IViaje } from './viajes.model';
import { AppError } from '../../shared/errors/AppError';
import { drainTripEvents } from '../notifications/notifications.events';
import { logger } from '../../config/logger';

import { CamionModel } from '../camiones/camiones.model';
import { CargaCombustibleInput } from './viajes.combustible';

export class ViajesService {
    async getFuelTrucks() {
        return CamionModel.find().select('patente').sort({ patente: 1 }).lean();
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

    async create(data: Partial<IViaje>): Promise<IViaje> {
        const viaje = await this.repository.create(data);
        if (data.tipoAsignacion === 'chofer' && data.asignadoId) await this.deliverNotifications();
        return viaje;
    }

    async update(id: string, data: Partial<IViaje>): Promise<IViaje> {
        const viaje = await this.repository.update(id, data);
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
