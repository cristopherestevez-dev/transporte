import {
    FacturacionRepository,
    cobranzasNacionalesRepository,
    cobranzasInternacionalesRepository,
    pagosNacionalesRepository,
    pagosInternacionalesRepository
} from './facturacion.repository';
import { IFacturacion } from './facturacion.model';
import { AppError } from '../../shared/errors/AppError';

type TipoFacturacion = 'cobranzas-nacionales' | 'cobranzas-internacionales' | 'pagos-nacionales' | 'pagos-internacionales';

const repoMap: Record<TipoFacturacion, FacturacionRepository> = {
    'cobranzas-nacionales': cobranzasNacionalesRepository,
    'cobranzas-internacionales': cobranzasInternacionalesRepository,
    'pagos-nacionales': pagosNacionalesRepository,
    'pagos-internacionales': pagosInternacionalesRepository,
};

export class FacturacionService {
    private repository: FacturacionRepository;
    private tipo: string;

    constructor(tipo: TipoFacturacion) {
        this.tipo = tipo;
        this.repository = repoMap[tipo];
    }

    async getAll(): Promise<IFacturacion[]> {
        return this.repository.findAll();
    }

    async getById(id: string): Promise<IFacturacion> {
        const item = await this.repository.findById(id);
        if (!item) {
            throw new AppError(`${this.tipo} no encontrado`, 404);
        }
        return item;
    }

    async create(data: Partial<IFacturacion>): Promise<IFacturacion> {
        return this.repository.create(data);
    }

    async update(id: string, data: Partial<IFacturacion>): Promise<IFacturacion> {
        const item = await this.repository.update(id, data);
        if (!item) {
            throw new AppError(`${this.tipo} no encontrado`, 404);
        }
        return item;
    }

    async delete(id: string): Promise<void> {
        const item = await this.repository.delete(id);
        if (!item) {
            throw new AppError(`${this.tipo} no encontrado`, 404);
        }
    }

    async count(): Promise<number> {
        return this.repository.count();
    }
}

export const cobranzasNacionalesService = new FacturacionService('cobranzas-nacionales');
export const cobranzasInternacionalesService = new FacturacionService('cobranzas-internacionales');
export const pagosNacionalesService = new FacturacionService('pagos-nacionales');
export const pagosInternacionalesService = new FacturacionService('pagos-internacionales');
