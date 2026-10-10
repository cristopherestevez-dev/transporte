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
        const existing = await this.repository.findAll();
        if (existing.some(item => item.cuit === data.cuit && item.tipo_comprobante === data.tipo_comprobante && item.numero_comprobante === data.numero_comprobante)) {
            throw new AppError('Este comprobante ya está registrado para la empresa', 409);
        }
        return this.repository.create({ ...data, estado: 'pendiente', monto_pagado: 0, monto_restante: data.monto, historial_pagos: [] });
    }

    async update(id: string, data: Partial<IFacturacion>): Promise<IFacturacion> {
        const current = await this.getById(id);
        const allowed = ['moneda', 'estado', 'plazo', 'historial_pagos', 'metodos_pago', 'cheques', 'orden_pago_pdf', 'orden_pago_url'];
        data = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key))) as Partial<IFacturacion>;
        if (data.estado && ['pagado', 'cobrado'].includes(current.estado) && data.estado !== current.estado) {
            throw new AppError('El comprobante ya fue finalizado', 409);
        }
        if (data.orden_pago_url && !/^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(data.orden_pago_url)) {
            throw new AppError('El adjunto debe ser un PDF', 400);
        }
        if (data.historial_pagos) {
            if (!this.tipo.startsWith('pagos') || current.estado === 'pagado') throw new AppError('Pago no permitido', 409);
            const previous = current.historial_pagos || [];
            const history = data.historial_pagos;
            if (history.length !== previous.length + 1 || JSON.stringify(history.slice(0, -1)) !== JSON.stringify(previous)) {
                throw new AppError('La factura cambió. Recargá antes de registrar el pago', 409);
            }
            const payment = history[history.length - 1];
            const amount = payment?.monto;
            const remaining = current.monto - (current.monto_pagado || 0);
            if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > remaining) throw new AppError('Monto de pago inválido', 400);
            const methods = payment.metodos_pago || {};
            let total = 0;
            for (const method of ['efectivo', 'transferencia']) {
                if (methods[method]?.enabled) {
                    const value = Number(methods[method].monto);
                    if (!Number.isFinite(value) || value <= 0) throw new AppError('Monto del método inválido', 400);
                    total += value;
                }
            }
            if (methods.cheque?.enabled) {
                if (!Array.isArray(payment.cheques) || !payment.cheques.length) throw new AppError('Falta el detalle de cheques', 400);
                for (const cheque of payment.cheques) {
                    const value = Number(cheque.monto);
                    if (!cheque.numero || !Number.isFinite(value) || value <= 0) throw new AppError('Cheque inválido', 400);
                    total += value;
                }
            }
            if (Math.abs(total - amount) > 0.005) throw new AppError('Los métodos no coinciden con el monto', 400);
            data.monto_pagado = Math.round(((current.monto_pagado || 0) + amount) * 100) / 100;
            data.monto_restante = Math.round((current.monto - data.monto_pagado) * 100) / 100;
            data.estado = data.monto_restante === 0 ? 'pagado' : 'pago_parcial';
            data.metodos_pago = methods;
            data.cheques = payment.cheques || [];
        } else if (data.estado === 'pagado' || data.estado === 'pago_parcial') {
            throw new AppError('Registrá el pago con sus métodos y montos', 400);
        }
        const item = await this.repository.update(id, data, current.updatedAt);
        if (!item) throw new AppError('El comprobante cambió. Recargá e intentá nuevamente', 409);
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
