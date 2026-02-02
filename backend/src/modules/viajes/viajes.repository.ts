import { ViajeNacionalModel, ViajeInternacionalModel, IViaje } from './viajes.model';
import { Model } from 'mongoose';

export class ViajesRepository {
    private model: Model<IViaje>;

    constructor(tipo: 'nacional' | 'internacional') {
        this.model = tipo === 'nacional' ? ViajeNacionalModel : ViajeInternacionalModel;
    }

    async findAll(): Promise<IViaje[]> {
        return this.model.find().sort({ createdAt: -1 });
    }

    async findById(id: string): Promise<IViaje | null> {
        return this.model.findById(id);
    }

    async create(data: Partial<IViaje>): Promise<IViaje> {
        return this.model.create(data);
    }

    async update(id: string, data: Partial<IViaje>): Promise<IViaje | null> {
        return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id: string): Promise<IViaje | null> {
        return this.model.findByIdAndDelete(id);
    }

    async count(): Promise<number> {
        return this.model.countDocuments();
    }
}

export const viajesNacionalesRepository = new ViajesRepository('nacional');
export const viajesInternacionalesRepository = new ViajesRepository('internacional');
