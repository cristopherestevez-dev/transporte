import { SemirremolquesRepository } from './semirremolques.repository';
import { ISemirremolque } from './semirremolques.model';
import { AppError } from '../../shared/errors/AppError';

const semirremolquesRepository = new SemirremolquesRepository();

export class SemirremolquesService {
    async getAll(): Promise<ISemirremolque[]> {
        return semirremolquesRepository.findAll();
    }

    async getById(id: string): Promise<ISemirremolque> {
        const semirremolque = await semirremolquesRepository.findById(id);
        if (!semirremolque) {
            throw new AppError('Semirremolque no encontrado', 404);
        }
        return semirremolque;
    }

    async create(data: Partial<ISemirremolque>): Promise<ISemirremolque> {
        return semirremolquesRepository.create(data);
    }

    async update(id: string, data: Partial<ISemirremolque>): Promise<ISemirremolque> {
        const semirremolque = await semirremolquesRepository.update(id, data);
        if (!semirremolque) {
            throw new AppError('Semirremolque no encontrado', 404);
        }
        return semirremolque;
    }

    async delete(id: string): Promise<void> {
        const semirremolque = await semirremolquesRepository.delete(id);
        if (!semirremolque) {
            throw new AppError('Semirremolque no encontrado', 404);
        }
    }

    async count(): Promise<number> {
        return semirremolquesRepository.count();
    }
}
