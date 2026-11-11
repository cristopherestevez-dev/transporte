import { z } from 'zod';

const method = z.object({ enabled: z.boolean(), monto: z.union([z.string(), z.number()]) });
const cheque = z.object({ numero: z.string().trim().min(1).max(100), monto: z.union([z.string(), z.number()]), vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => !Number.isNaN(Date.parse(value)), 'Vencimiento inválido').optional() });
const payment = z.object({
    fecha: z.string().min(1),
    monto: z.number().positive().finite(),
    metodos_pago: z.object({ efectivo: method.optional(), transferencia: method.optional(), cheque: method.optional() }),
    cheques: z.array(cheque).optional(),
    observaciones: z.string().trim().max(1000).optional(),
});

export const CreateFacturacionSchema = z.object({
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => !Number.isNaN(Date.parse(value)), 'Fecha inválida'),
    razon_social: z.string().trim().min(1).max(200),
    cuit: z.string().trim().min(1).max(30),
    tipo_comprobante: z.enum(['factura_a', 'factura_b', 'factura_c', 'factura_e', 'nota_credito', 'nota_debito', 'recibo']),
    numero_comprobante: z.string().trim().min(1).max(100),
    moneda: z.enum(['ARS', 'USD', 'CLP']),
    monto: z.number().positive().finite(),
    plazo: z.number().int().min(0).max(3650).default(30),
});

export const UpdateFacturacionSchema = z.object({
    moneda: z.enum(['ARS', 'USD', 'CLP']).optional(),
    estado: z.enum(['pendiente', 'vencido', 'cobrado', 'pagado', 'pago_parcial']).optional(),
    plazo: z.number().int().min(0).max(3650).optional(),
    historial_pagos: z.array(payment).max(1000).optional(),
    orden_pago_pdf: z.string().max(255).optional(),
    orden_pago_url: z.string().max(7 * 1024 * 1024).optional(),
});

export const GroupPaymentSchema = z.object({
    facturas: z.array(z.object({
        id: z.string().regex(/^[0-9a-f]{24}$/i).transform(id => id.toLowerCase()),
        version: z.string().datetime(),
    })).min(2).max(50).refine(rows => new Set(rows.map(row => row.id)).size === rows.length, 'Hay facturas duplicadas'),
    pago: payment,
    orden_pago_pdf: z.string().min(1).max(255),
    orden_pago_url: z.string().max(300000).regex(/^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/),
});
