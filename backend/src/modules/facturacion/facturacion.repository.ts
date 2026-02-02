import {
    CobranzaNacionalModel,
    CobranzaInternacionalModel,
    PagoNacionalModel,
    PagoInternacionalModel,
    IFacturacion
} from './facturacion.model';
import { Model } from 'mongoose';

type TipoFacturacion = 'cobranzas-nacionales' | 'cobranzas-internacionales' | 'pagos-nacionales' | 'pagos-internacionales';

const modelMap: Record<TipoFacturacion, Model<IFacturacion>> = {
    'cobranzas-nacionales': CobranzaNacionalModel,
    'cobranzas-internacionales': CobranzaInternacionalModel,
    'pagos-nacionales': PagoNacionalModel,
    'pagos-internacionales': PagoInternacionalModel,
};

export class FacturacionRepository {
    private model: Model<IFacturacion>;

    constructor(tipo: TipoFacturacion) {
        this.model = modelMap[tipo];
    }

    async findAll(): Promise<IFacturacion[]> {
        return this.model.find().sort({ fecha: -1 });
    }

    async findById(id: string): Promise<IFacturacion | null> {
        return this.model.findById(id);
    }

    async create(data: Partial<IFacturacion>): Promise<IFacturacion> {
        return this.model.create(data);
    }

    async update(id: string, data: Partial<IFacturacion>): Promise<IFacturacion | null> {
        return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id: string): Promise<IFacturacion | null> {
        return this.model.findByIdAndDelete(id);
    }

    async count(): Promise<number> {
        return this.model.countDocuments();
    }

    async sumByEstado(estado: string): Promise<number> {
        const result = await this.model.aggregate([
            { $match: { estado } },
            { $group: { _id: null, total: { $sum: '$monto' } } }
        ]);
        return result[0]?.total || 0;
    }
}

export const cobranzasNacionalesRepository = new FacturacionRepository('cobranzas-nacionales');
export const cobranzasInternacionalesRepository = new FacturacionRepository('cobranzas-internacionales');
export const pagosNacionalesRepository = new FacturacionRepository('pagos-nacionales');
export const pagosInternacionalesRepository = new FacturacionRepository('pagos-internacionales');
