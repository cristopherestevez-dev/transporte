import { FleterosRepository } from './fleteros.repository';
import { IFletero } from './fleteros.model';
import { AppError } from '../../shared/errors/AppError';

const fleterosRepository = new FleterosRepository();

export class FleterosService {
    async getAll(): Promise<IFletero[]> {
        return fleterosRepository.findAll();
    }

    async getById(id: string): Promise<IFletero> {
        const fletero = await fleterosRepository.findById(id);
        if (!fletero) {
            throw new AppError('Fletero no encontrado', 404);
        }
        return fletero;
    }

    async create(data: Partial<IFletero>): Promise<IFletero> {
        return fleterosRepository.create(data);
    }

    async update(id: string, data: Partial<IFletero>): Promise<IFletero> {
        const fletero = await fleterosRepository.update(id, data);
        if (!fletero) {
            throw new AppError('Fletero no encontrado', 404);
        }
        return fletero;
    }

    async delete(id: string): Promise<void> {
        const fletero = await fleterosRepository.delete(id);
        if (!fletero) {
            throw new AppError('Fletero no encontrado', 404);
        }
    }

    async count(): Promise<number> {
        return fleterosRepository.count();
    }
}
