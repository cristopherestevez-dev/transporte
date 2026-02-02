import { ViajesRepository, viajesNacionalesRepository, viajesInternacionalesRepository } from './viajes.repository';
import { IViaje } from './viajes.model';
import { AppError } from '../../shared/errors/AppError';

export class ViajesService {
    private repository: ViajesRepository;
    private tipo: string;

    constructor(tipo: 'nacional' | 'internacional') {
        this.tipo = tipo;
        this.repository = tipo === 'nacional' ? viajesNacionalesRepository : viajesInternacionalesRepository;
    }

    async getAll(): Promise<IViaje[]> {
        return this.repository.findAll();
    }

    async getById(id: string): Promise<IViaje> {
        const viaje = await this.repository.findById(id);
        if (!viaje) {
            throw new AppError(`Viaje ${this.tipo} no encontrado`, 404);
        }
        return viaje;
    }

    async create(data: Partial<IViaje>): Promise<IViaje> {
        return this.repository.create(data);
    }

    async update(id: string, data: Partial<IViaje>): Promise<IViaje> {
        const viaje = await this.repository.update(id, data);
        if (!viaje) {
            throw new AppError(`Viaje ${this.tipo} no encontrado`, 404);
        }
        return viaje;
    }

    async delete(id: string): Promise<void> {
        const viaje = await this.repository.delete(id);
        if (!viaje) {
            throw new AppError(`Viaje ${this.tipo} no encontrado`, 404);
        }
    }

    async count(): Promise<number> {
        return this.repository.count();
    }
}

export const viajesNacionalesService = new ViajesService('nacional');
export const viajesInternacionalesService = new ViajesService('internacional');
