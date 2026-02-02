import { CamionModel, ICamion } from './camiones.model';

export class CamionesRepository {
    async findAll(): Promise<ICamion[]> {
        return CamionModel.find().sort({ createdAt: -1 });
    }

    async findById(id: string): Promise<ICamion | null> {
        return CamionModel.findById(id);
    }

    async create(data: Partial<ICamion>): Promise<ICamion> {
        return CamionModel.create(data);
    }

    async update(id: string, data: Partial<ICamion>): Promise<ICamion | null> {
        return CamionModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id: string): Promise<ICamion | null> {
        return CamionModel.findByIdAndDelete(id);
    }

    async count(): Promise<number> {
        return CamionModel.countDocuments();
    }
}
