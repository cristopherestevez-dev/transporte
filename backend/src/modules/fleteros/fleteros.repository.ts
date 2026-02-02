import { FleteroModel, IFletero } from './fleteros.model';

export class FleterosRepository {
    async findAll(): Promise<IFletero[]> {
        return FleteroModel.find().sort({ createdAt: -1 });
    }

    async findById(id: string): Promise<IFletero | null> {
        return FleteroModel.findById(id);
    }

    async create(data: Partial<IFletero>): Promise<IFletero> {
        return FleteroModel.create(data);
    }

    async update(id: string, data: Partial<IFletero>): Promise<IFletero | null> {
        return FleteroModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id: string): Promise<IFletero | null> {
        return FleteroModel.findByIdAndDelete(id);
    }

    async count(): Promise<number> {
        return FleteroModel.countDocuments();
    }
}
