import { ChoferesRepository } from './choferes.repository';
import { IChofer } from './choferes.model';
import { AppError } from '../../shared/errors/AppError';

const choferesRepository = new ChoferesRepository();

export class ChoferesService {
    async getAll(): Promise<IChofer[]> {
        return choferesRepository.findAll();
    }

    async getById(id: string): Promise<IChofer> {
        const chofer = await choferesRepository.findById(id);
        if (!chofer) {
            throw new AppError('Chofer no encontrado', 404);
        }
        return chofer;
    }

    async create(data: Partial<IChofer>): Promise<IChofer> {
        return choferesRepository.create(data);
    }

    async update(id: string, data: Partial<IChofer>): Promise<IChofer> {
        const chofer = await choferesRepository.update(id, data);
        if (!chofer) {
            throw new AppError('Chofer no encontrado', 404);
        }
        return chofer;
    }

    async delete(id: string): Promise<void> {
        const chofer = await choferesRepository.delete(id);
        if (!chofer) {
            throw new AppError('Chofer no encontrado', 404);
        }
    }

    async count(): Promise<number> {
        return choferesRepository.count();
    }
}
