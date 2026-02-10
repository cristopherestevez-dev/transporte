import { MantenimientoRepository, SearchFilters } from './mantenimiento.repository';
import { IMantenimiento } from './mantenimiento.model';
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
        return mantenimientoRepository.create(data);
    }

    async update(id: string, data: Partial<IMantenimiento>): Promise<IMantenimiento> {
        const registro = await mantenimientoRepository.update(id, data);
        if (!registro) {
            throw new AppError('Registro de mantenimiento no encontrado', 404);
        }
        return registro;
    }

    async delete(id: string): Promise<void> {
        const registro = await mantenimientoRepository.delete(id);
        if (!registro) {
            throw new AppError('Registro de mantenimiento no encontrado', 404);
        }
    }

    async search(vehiculoId: string, filters: SearchFilters): Promise<IMantenimiento[]> {
        return mantenimientoRepository.search(vehiculoId, filters);
    }
}
