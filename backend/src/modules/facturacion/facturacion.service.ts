import {
    FacturacionRepository,
    cobranzasNacionalesRepository,
    cobranzasInternacionalesRepository,
    pagosNacionalesRepository,
    pagosInternacionalesRepository
} from './facturacion.repository';
import mongoose, { ClientSession } from 'mongoose';
import { z } from 'zod';
import { GroupPaymentSchema } from './facturacion.dto';
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

    async getById(id: string, session?: ClientSession): Promise<IFacturacion> {
        const item = await this.repository.findById(id, session);
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

    async update(id: string, data: Partial<IFacturacion>, session?: ClientSession): Promise<IFacturacion> {
        const current = await this.getById(id, session);
        const allowed = ['moneda', 'estado', 'plazo', 'historial_pagos', 'metodos_pago', 'cheques', 'orden_pago_pdf', 'orden_pago_url'];
        data = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key))) as Partial<IFacturacion>;
        const isPayment = this.tipo.startsWith('pagos');
        const finalState = isPayment ? 'pagado' : 'cobrado';
        if (data.estado === (isPayment ? 'cobrado' : 'pagado')) throw new AppError('Estado incompatible con este comprobante', 400);
        if (data.estado && ['pagado', 'cobrado'].includes(current.estado) && data.estado !== current.estado) {
            throw new AppError('El comprobante ya fue finalizado', 409);
        }
        if (data.orden_pago_url && !/^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(data.orden_pago_url)) {
            throw new AppError('El adjunto debe ser un PDF', 400);
        }
        if (data.historial_pagos) {
            if (['pagado', 'cobrado'].includes(current.estado)) throw new AppError('El comprobante ya fue finalizado', 409);
            const previous = current.historial_pagos || [];
            const history = data.historial_pagos;
            if (history.length !== previous.length + 1 || JSON.stringify(history.slice(0, -1)) !== JSON.stringify(previous)) {
                throw new AppError('La factura cambió. Recargá antes de registrar el pago', 409);
            }
            const payment = history[history.length - 1];
            const amount = payment?.monto;
            const remaining = Math.round((current.monto - (current.monto_pagado || 0)) * 100) / 100;
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
                const numbers = new Set<string>();
                for (const cheque of payment.cheques) {
                    const value = Number(cheque.monto);
                    if (!cheque.numero || !Number.isFinite(value) || value <= 0) throw new AppError('Cheque inválido', 400);
                    if (!cheque.vencimiento || !/^\d{4}-\d{2}-\d{2}$/.test(cheque.vencimiento) || Number.isNaN(Date.parse(cheque.vencimiento)) || new Date(cheque.vencimiento).toISOString().slice(0, 10) !== cheque.vencimiento) throw new AppError('Ingresá un vencimiento válido para cada cheque', 400);
                    if (numbers.has(cheque.numero)) throw new AppError('No repitas el número de cheque en el mismo movimiento', 400);
                    numbers.add(cheque.numero);
                    total += value;
                }
            }
            if (Math.abs(total - amount) > 0.005) throw new AppError('Los métodos no coinciden con el monto', 400);
            data.monto_pagado = Math.round(((current.monto_pagado || 0) + amount) * 100) / 100;
            data.monto_restante = Math.round((current.monto - data.monto_pagado) * 100) / 100;
            data.estado = data.monto_restante === 0 ? finalState : 'pago_parcial';
            data.metodos_pago = methods;
            data.cheques = payment.cheques || [];
        } else if (data.estado === 'pagado' || data.estado === 'pago_parcial') {
            throw new AppError('Registrá el pago con sus métodos y montos', 400);
        } else if (data.estado === 'cobrado') {
            data.monto_pagado = current.monto;
            data.monto_restante = 0;
        }
        const item = await this.repository.update(id, data, current.updatedAt, session);
        if (!item) throw new AppError('El comprobante cambió. Recargá e intentá nuevamente', 409);
        return item;
    }

    async settleGroup(data: z.infer<typeof GroupPaymentSchema>): Promise<IFacturacion[]> {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                const invoices: IFacturacion[] = [];
                for (const row of data.facturas) invoices.push(await this.getById(row.id, session));
                const first = invoices[0];
                const cents = (value: number | string) => Math.round(Number(value) * 100);
                const balance = (invoice: IFacturacion) => cents(invoice.monto - (invoice.monto_pagado || 0));
                const name = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
                const taxId = (value: string) => value.replace(/\D/g, '');
                for (const [index, invoice] of invoices.entries()) {
                    if (name(invoice.razon_social) !== name(first.razon_social) || taxId(invoice.cuit) !== taxId(first.cuit) || !first.moneda || invoice.moneda !== first.moneda) {
                        throw new AppError('Seleccioná facturas de la misma razón social, CUIT y moneda', 400);
                    }
                    if (invoice.updatedAt.toISOString() !== data.facturas[index].version || invoice.estado === 'pagado' || balance(invoice) <= 0) {
                        throw new AppError('Una factura cambió. Recargá la lista y volvé a seleccionarla', 409);
                    }
                }

                const movement = data.pago;
                const methods = movement.metodos_pago;
                const cheques = movement.cheques || [];
                const parts = (['transferencia', 'efectivo'] as const).flatMap(method => {
                    const entry = methods[method];
                    if (!entry?.enabled) return [];
                    return [{ method, remaining: cents(entry.monto) }];
                }) as { method: 'transferencia' | 'efectivo' | 'cheque'; remaining: number; cheque?: typeof cheques[number] }[];
                if (methods.cheque?.enabled) {
                    if (!cheques.length || new Set(cheques.map(cheque => cheque.numero)).size !== cheques.length ||
                        cents(methods.cheque.monto) !== cheques.reduce((sum, cheque) => sum + cents(cheque.monto), 0)) {
                        throw new AppError('Revisá los importes y números de los cheques', 400);
                    }
                    for (const cheque of cheques) parts.push({ method: 'cheque', remaining: cents(cheque.monto), cheque });
                } else if (cheques.length) {
                    throw new AppError('Seleccioná cheque como forma de pago', 400);
                }
                const total = invoices.reduce((sum, invoice) => sum + balance(invoice), 0);
                if (parts.some(part => !Number.isSafeInteger(part.remaining) || part.remaining <= 0) ||
                    cents(movement.monto) !== total || parts.reduce((sum, part) => sum + part.remaining, 0) !== total) {
                    throw new AppError('Las formas de pago deben cubrir el saldo exacto de las facturas seleccionadas', 400);
                }

                const saved: IFacturacion[] = [];
                let index = 0;
                for (const invoice of invoices) {
                    let pending = balance(invoice);
                    const applied: typeof methods = {};
                    const appliedCheques: typeof cheques = [];
                    while (pending > 0) {
                        const part = parts[index];
                        const amount = Math.min(pending, part.remaining);
                        applied[part.method] = { enabled: true, monto: (cents(applied[part.method]?.monto || 0) + amount) / 100 };
                        if (part.cheque) appliedCheques.push({ ...part.cheque, monto: amount / 100 });
                        pending -= amount;
                        part.remaining -= amount;
                        if (part.remaining === 0) index++;
                    }
                    const payment = { ...movement, monto: balance(invoice) / 100, metodos_pago: applied, cheques: appliedCheques };
                    saved.push(await this.update(String(invoice._id), {
                        historial_pagos: [...(invoice.historial_pagos || []), payment],
                        orden_pago_pdf: data.orden_pago_pdf,
                        orden_pago_url: data.orden_pago_url,
                    }, session));
                }
                return saved;
            });
        } catch (error) {
            if ((error as { code?: number })?.code === 20) {
                throw new AppError('El pago agrupado requiere MongoDB con transacciones habilitadas', 503);
            }
            throw error;
        } finally {
            await session.endSession();
        }
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
