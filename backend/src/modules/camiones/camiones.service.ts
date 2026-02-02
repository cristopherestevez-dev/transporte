import { CamionesRepository } from './camiones.repository';
import { ICamion } from './camiones.model';
import { AppError } from '../../shared/errors/AppError';

const camionesRepository = new CamionesRepository();

export class CamionesService {
    async getAll(): Promise<ICamion[]> {
        return camionesRepository.findAll();
    }

    async getById(id: string): Promise<ICamion> {
        const camion = await camionesRepository.findById(id);
        if (!camion) {
            throw new AppError('Camión no encontrado', 404);
        }
        return camion;
    }

    async create(data: Partial<ICamion>): Promise<ICamion> {
        return camionesRepository.create(data);
    }

    async update(id: string, data: Partial<ICamion>): Promise<ICamion> {
        const camion = await camionesRepository.update(id, data);
        if (!camion) {
            throw new AppError('Camión no encontrado', 404);
        }
        return camion;
    }

    async delete(id: string): Promise<void> {
        const camion = await camionesRepository.delete(id);
        if (!camion) {
            throw new AppError('Camión no encontrado', 404);
        }
    }

    async count(): Promise<number> {
        return camionesRepository.count();
    }
}
