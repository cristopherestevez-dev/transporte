import { ProveedorModel, IProveedor } from './proveedores.model';

export class ProveedoresRepository {
    async findAll(): Promise<IProveedor[]> {
        return ProveedorModel.find().sort({ createdAt: -1 });
    }

    async findById(id: string): Promise<IProveedor | null> {
        return ProveedorModel.findById(id);
    }

    async create(data: Partial<IProveedor>): Promise<IProveedor> {
        return ProveedorModel.create(data);
    }

    async update(id: string, data: Partial<IProveedor>): Promise<IProveedor | null> {
        return ProveedorModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id: string): Promise<IProveedor | null> {
        return ProveedorModel.findByIdAndDelete(id);
    }

    async count(): Promise<number> {
        return ProveedorModel.countDocuments();
    }
}
