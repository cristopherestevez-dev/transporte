import { ProveedoresRepository } from './proveedores.repository';
import { IProveedor } from './proveedores.model';
import { AppError } from '../../shared/errors/AppError';

const proveedoresRepository = new ProveedoresRepository();

export class ProveedoresService {
    async getAll(): Promise<IProveedor[]> {
        return proveedoresRepository.findAll();
    }

    async getById(id: string): Promise<IProveedor> {
        const proveedor = await proveedoresRepository.findById(id);
        if (!proveedor) {
            throw new AppError('Proveedor no encontrado', 404);
        }
        return proveedor;
    }

    async create(data: Partial<IProveedor>): Promise<IProveedor> {
        return proveedoresRepository.create(data);
    }

    async update(id: string, data: Partial<IProveedor>): Promise<IProveedor> {
        const proveedor = await proveedoresRepository.update(id, data);
        if (!proveedor) {
            throw new AppError('Proveedor no encontrado', 404);
        }
        return proveedor;
    }

    async delete(id: string): Promise<void> {
        const proveedor = await proveedoresRepository.delete(id);
        if (!proveedor) {
            throw new AppError('Proveedor no encontrado', 404);
        }
    }

    async count(): Promise<number> {
        return proveedoresRepository.count();
    }
}
