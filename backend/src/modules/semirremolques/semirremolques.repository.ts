import { SemirremolqueModel, ISemirremolque } from './semirremolques.model';

export class SemirremolquesRepository {
    async findAll(): Promise<ISemirremolque[]> {
        return SemirremolqueModel.find().sort({ createdAt: -1 });
    }

    async findById(id: string): Promise<ISemirremolque | null> {
        return SemirremolqueModel.findById(id);
    }

    async create(data: Partial<ISemirremolque>): Promise<ISemirremolque> {
        return SemirremolqueModel.create(data);
    }

    async update(id: string, data: Partial<ISemirremolque>): Promise<ISemirremolque | null> {
        return SemirremolqueModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id: string): Promise<ISemirremolque | null> {
        return SemirremolqueModel.findByIdAndDelete(id);
    }

    async count(): Promise<number> {
        return SemirremolqueModel.countDocuments();
    }
}
