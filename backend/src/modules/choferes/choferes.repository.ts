import { ChoferModel, IChofer } from './choferes.model';

export class ChoferesRepository {
    async findAll(): Promise<IChofer[]> {
        return ChoferModel.find().sort({ createdAt: -1 });
    }

    async findById(id: string): Promise<IChofer | null> {
        return ChoferModel.findById(id);
    }

    async create(data: Partial<IChofer>): Promise<IChofer> {
        return ChoferModel.create(data);
    }

    async update(id: string, data: Partial<IChofer>): Promise<IChofer | null> {
        return ChoferModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id: string): Promise<IChofer | null> {
        return ChoferModel.findByIdAndDelete(id);
    }

    async count(): Promise<number> {
        return ChoferModel.countDocuments();
    }
}
