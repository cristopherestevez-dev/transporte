import { listContext, paginateQuery } from '../../shared/pagination';
import { ViajeNacionalModel, ViajeInternacionalModel, IViaje } from './viajes.model';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { AppError } from '../../shared/errors/AppError';

import { CargaCombustible } from './viajes.combustible';

export class ViajesRepository {
    private model: Model<IViaje>;

    constructor(tipo: 'nacional' | 'internacional') {
        this.model = tipo === 'nacional' ? ViajeNacionalModel : ViajeInternacionalModel;
    }

    async findAll(): Promise<IViaje[]> {
        const filters = listContext.getStore()?.filters ?? {};
        const criteria: Record<string, unknown> = {};

        for (const field of ['origen', 'destino', 'carga', 'numero_comprobante', 'proveedor', 'camionPatente', 'semirremolquePatente']) {
            const value = filters[`viaje_${field}`];
            if (value) criteria[field] = { $regex: value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
        }

        for (const field of ['fecha_salida', 'fecha_llegada', 'estado', 'tipo_comprobante']) {
            const value = filters[`viaje_${field}`];
            if (value) criteria[field] = field === 'tipo_comprobante' && value === 'sin_factura' ? { $in: ['', null] } : value;
        }

        if (filters.viaje_operadorLogisticoId) {
            criteria.operadorLogisticoId = filters.viaje_operadorLogisticoId === 'sin-operador'
                ? { $in: ['', null] }
                : filters.viaje_operadorLogisticoId;
        }

        if (filters.viaje_asignadoId) {
            const [tipoAsignacion, asignadoId] = filters.viaje_asignadoId.split(':');
            criteria.tipoAsignacion = tipoAsignacion;
            criteria.asignadoId = asignadoId || '';
        }

        return paginateQuery(this.model, this.model.find(criteria).sort({ fecha_salida: -1, createdAt: -1, _id: -1 }));
    }

    async findById(id: string): Promise<IViaje | null> {
        return this.model.findById(id);
    }

    async create(data: Partial<IViaje>): Promise<IViaje> {
        const event = this.assignmentEvent(data.tipoAsignacion, data.asignadoId);
        return this.model.create({ ...data, ...(event ? { notificationEvents: [event] } : {}) });
    }

    private assignmentEvent(tipo: IViaje['tipoAsignacion'], driverId?: string) {
        if (tipo !== 'chofer' || !driverId) return undefined;
        return { eventId: new mongoose.Types.ObjectId().toString(), driverId, createdAt: new Date() };
    }

    async update(id: string, data: Partial<IViaje>, snapshot?: IViaje): Promise<IViaje | null> {
        const changesAssignment = data.tipoAsignacion !== undefined || data.asignadoId !== undefined;
        if (!data.estado && !changesAssignment && !snapshot) return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });

        const previous = snapshot ?? await this.model.findById(id);
        if (!previous) return null;
        const statusEvent = data.estado && previous.estado !== data.estado
            ? { eventId: new mongoose.Types.ObjectId().toString(), previous: previous.estado, current: data.estado, createdAt: new Date() }
            : undefined;
        const tipo = data.tipoAsignacion === undefined ? previous.tipoAsignacion : data.tipoAsignacion;
        const driverId = data.asignadoId === undefined ? previous.asignadoId : data.asignadoId;
        const assignmentEvent = tipo !== previous.tipoAsignacion || driverId !== previous.asignadoId
            ? this.assignmentEvent(tipo, driverId)
            : undefined;
        const events = [statusEvent, assignmentEvent].filter(Boolean);
        const filter = {
            _id: id,
            ...(data.estado ? { estado: previous.estado ?? null } : {}),
            ...(snapshot && data.semirremolqueId !== undefined ? { semirremolqueId: previous.semirremolqueId ?? null } : {}),
            ...(changesAssignment ? { tipoAsignacion: previous.tipoAsignacion ?? null, asignadoId: previous.asignadoId ?? null } : {}),
        };
        const result = await this.model.findOneAndUpdate(filter, {
            $set: data,
            ...(events.length ? { $push: { notificationEvents: { $each: events } } } : {}),
        }, { new: true, runValidators: true });
        if (!result) throw new AppError('El viaje cambió mientras lo editabas. Recargá y volvé a intentar', 409);
        return result;
    }

    async addFuel(id: string, carga: CargaCombustible): Promise<IViaje | null> {
        return this.model.findOneAndUpdate(
            { _id: id, 'cargasCombustible.registroId': { $ne: carga.registroId } },
            { $push: { cargasCombustible: carga } },
            { new: true, runValidators: true },
        );
    }

    async delete(id: string): Promise<IViaje | null> {
        return this.model.findByIdAndDelete(id);
    }

    async count(): Promise<number> {
        return this.model.countDocuments();
    }
}

export const viajesNacionalesRepository = new ViajesRepository('nacional');
export const viajesInternacionalesRepository = new ViajesRepository('internacional');
