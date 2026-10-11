import { paginateQuery } from '../../shared/pagination';
import { ViajeNacionalModel, ViajeInternacionalModel, IViaje } from './viajes.model';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { AppError } from '../../shared/errors/AppError';

export class ViajesRepository {
    private model: Model<IViaje>;

    constructor(tipo: 'nacional' | 'internacional') {
        this.model = tipo === 'nacional' ? ViajeNacionalModel : ViajeInternacionalModel;
    }

    async findAll(): Promise<IViaje[]> {
        return paginateQuery(this.model, this.model.find().sort({ createdAt: -1 }));
    }

    async findById(id: string): Promise<IViaje | null> {
        return this.model.findById(id);
    }

    async create(data: Partial<IViaje>): Promise<IViaje> {
        return this.model.create(data);
    }

    async update(id: string, data: Partial<IViaje>): Promise<IViaje | null> {
        if (!data.estado) return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        const previous = await this.model.findById(id);
        if (!previous) return null;
        const event = previous.estado !== data.estado ? { eventId: new mongoose.Types.ObjectId().toString(), previous: previous.estado, current: data.estado, createdAt: new Date() } : null;
        const result = await this.model.findOneAndUpdate({ _id: id, estado: previous.estado }, {
            $set: data, ...(event ? { $push: { notificationEvents: event } } : {}),
        }, { new: true, runValidators: true });
        if (!result) throw new AppError('El viaje cambió mientras lo editabas. Recargá y volvé a intentar', 409);
        return result;
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
