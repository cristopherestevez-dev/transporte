import { MantenimientoModel, IMantenimiento } from './mantenimiento.model';

export interface SearchFilters {
    fecha?: string;
    kmMin?: number;
    kmMax?: number;
}

export class MantenimientoRepository {
    async findByVehiculo(vehiculoId: string): Promise<IMantenimiento[]> {
        return MantenimientoModel.find({ vehiculoId }).sort({ fecha: -1, km: -1 });
    }

    async findById(id: string): Promise<IMantenimiento | null> {
        return MantenimientoModel.findById(id);
    }

    async create(data: Partial<IMantenimiento>): Promise<IMantenimiento> {
        return MantenimientoModel.create(data);
    }

    async update(id: string, data: Partial<IMantenimiento>): Promise<IMantenimiento | null> {
        return MantenimientoModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id: string): Promise<IMantenimiento | null> {
        return MantenimientoModel.findByIdAndDelete(id);
    }

    async search(vehiculoId: string, filters: SearchFilters): Promise<IMantenimiento[]> {
        const query: any = { vehiculoId };

        if (filters.fecha) {
            query.fecha = filters.fecha;
        }

        if (filters.kmMin !== undefined || filters.kmMax !== undefined) {
            query.km = {};
            if (filters.kmMin !== undefined) {
                query.km.$gte = filters.kmMin;
            }
            if (filters.kmMax !== undefined) {
                query.km.$lte = filters.kmMax;
            }
        }

        return MantenimientoModel.find(query).sort({ fecha: -1, km: -1 });
    }
}
