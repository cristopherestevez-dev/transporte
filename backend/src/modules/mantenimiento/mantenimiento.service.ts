import { MantenimientoRepository, SearchFilters } from './mantenimiento.repository';
import { MantenimientoModel, IMantenimiento } from './mantenimiento.model';
import { AppError } from '../../shared/errors/AppError';

const mantenimientoRepository = new MantenimientoRepository();

export class MantenimientoService {
    async getByVehiculo(vehiculoId: string): Promise<IMantenimiento[]> {
        return mantenimientoRepository.findByVehiculo(vehiculoId);
    }

    async getById(id: string): Promise<IMantenimiento> {
        const registro = await mantenimientoRepository.findById(id);
        if (!registro) {
            throw new AppError('Registro de mantenimiento no encontrado', 404);
        }
        return registro;
    }

    async create(data: Partial<IMantenimiento>): Promise<IMantenimiento> {
        const validated = await this.validateRecord(data);
        return mantenimientoRepository.create(validated);
    }

    async update(id: string, data: Partial<IMantenimiento>): Promise<IMantenimiento> {
        const current = await this.getById(id);
        const validated = await this.validateRecord({ ...current.toObject(), ...data, vehiculoId: current.vehiculoId }, id);
        const registro = await mantenimientoRepository.update(id, validated);
        if (!registro) {
            throw new AppError('Registro de mantenimiento no encontrado', 404);
        }
        return registro;
    }

    private async validateRecord(data: Partial<IMantenimiento>, id?: string): Promise<Partial<IMantenimiento>> {
        const allowed = Object.keys(MantenimientoModel.schema.paths).filter(key => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key));
        const validated: any = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)));
        if (!validated.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(validated.fecha) || Number.isNaN(Date.parse(validated.fecha))) throw new AppError('Fecha inválida', 400);
        for (const [key, value] of Object.entries(validated)) {
            if (MantenimientoModel.schema.path(key)?.instance === 'Number') {
                const amount = Number(value);
                if (!Number.isFinite(amount) || amount < 0) throw new AppError('Los valores numéricos deben ser positivos o cero', 400);
                validated[key] = amount;
            }
        }
        const hasItem = Object.entries(validated).some(([key, value]) => key.endsWith('_cambio') && value === true);
        if (!hasItem && !validated.extras_descripcion?.trim() && !(validated.extras_precio > 0)) throw new AppError('Seleccioná un ítem de mantenimiento o un extra', 400);
        await new MantenimientoModel(validated).validate();
        const records = await mantenimientoRepository.findByVehiculo(validated.vehiculoId.toString());
        for (const record of records) {
            if (record._id.toString() === id) continue;
            if ((record.fecha < validated.fecha && record.km > validated.km) || (record.fecha > validated.fecha && record.km < validated.km)) {
                throw new AppError('El kilometraje debe ser coherente con el historial del vehículo', 400);
            }
        }
        return validated;
    }

    async delete(id: string): Promise<void> {
        const registro = await mantenimientoRepository.delete(id);
        if (!registro) {
            throw new AppError('Registro de mantenimiento no encontrado', 404);
        }
    }

    async search(vehiculoId: string, filters: SearchFilters): Promise<IMantenimiento[]> {
        if ([filters.kmMin, filters.kmMax].some(value => value !== undefined && (!Number.isFinite(value) || value < 0)) || (filters.kmMin !== undefined && filters.kmMax !== undefined && filters.kmMin > filters.kmMax)) throw new AppError('Rango de kilometraje inválido', 400);
        return mantenimientoRepository.search(vehiculoId, filters);
    }
}
