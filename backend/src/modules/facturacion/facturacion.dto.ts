import { z } from 'zod';

const method = z.object({ enabled: z.boolean(), monto: z.union([z.string(), z.number()]) });
const cheque = z.object({ numero: z.string().min(1), monto: z.union([z.string(), z.number()]) });
const payment = z.object({
    fecha: z.string().min(1),
    monto: z.number().positive().finite(),
    metodos_pago: z.object({ efectivo: method.optional(), transferencia: method.optional(), cheque: method.optional() }),
    cheques: z.array(cheque).optional(),
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
