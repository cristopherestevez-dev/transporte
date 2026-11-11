import { createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError';
import { tenantContext } from '../../shared/tenant';
import { ViajeNacionalModel, ViajeInternacionalModel } from '../viajes/viajes.model';
import { ProveedorModel } from '../proveedores/proveedores.model';
import { FleteroModel } from '../fleteros/fleteros.model';
import { PagoNacionalModel, PagoInternacionalModel } from './facturacion.model';
import { CreateFacturacionSchema } from './facturacion.dto';

export const InvoiceFromTripSchema = CreateFacturacionSchema.pick({
    fecha: true, moneda: true, monto: true, plazo: true,
});

export async function registerInvoiceFromTrip(
    scope: 'nacionales' | 'internacionales', id: string, fields: z.infer<typeof InvoiceFromTripSchema>,
) {
    const empresaId = tenantContext.getStore()?.empresaId;
    if (!empresaId) throw new AppError('Seleccioná una empresa operadora', 403);
    if (!/^[a-f0-9]{24}$/i.test(id)) throw new AppError('Viaje inválido', 400);

    const trips = scope === 'nacionales' ? ViajeNacionalModel : ViajeInternacionalModel;
    const payments = scope === 'nacionales' ? PagoNacionalModel : PagoInternacionalModel;
    const trip = await trips.findOne({ _id: id, direccion_facturacion: 'recibida' });
    if (!trip) throw new AppError('No se encontró el viaje que nos facturan', 404);
    if (!trip.tipo_comprobante || !trip.numero_comprobante?.trim()) {
        throw new AppError('Completá el tipo y número de factura en el viaje', 400);
    }

    const issuerId = trip.tipoAsignacion === 'fletero' ? trip.asignadoId : trip.proveedorId;
    if (!issuerId || !/^[a-f0-9]{24}$/i.test(issuerId)) {
        throw new AppError('Seleccioná la empresa o el fletero que emitió la factura', 400);
    }
    const issuer = trip.tipoAsignacion === 'fletero' ? await FleteroModel.findById(issuerId) : await ProveedorModel.findById(issuerId);
    const cuit = issuer?.cuil_cuit?.replace(/\D/g, '');
    if (!issuer || !cuit) throw new AppError('Completá el CUIT/CUIL del emisor', 400);

    const number = trip.numero_comprobante.trim();
    const identity = { tipo_comprobante: trip.tipo_comprobante, numero_comprobante: number };
    const cuitPattern = new RegExp('^\\s*' + cuit.split('').join('[\\s-]*') + '\\s*$');
    const existing = await payments.findOne({ ...identity, cuit: cuitPattern });
    if (existing) return { payment: existing, created: false };

    const key = JSON.stringify([empresaId, scope, cuit, trip.tipo_comprobante, number]);
    const paymentId = new Types.ObjectId(createHash('sha256').update(key).digest('hex').slice(0, 24));
    try {
        const payment = await payments.create({
            _id: paymentId, ...fields, ...identity, razon_social: issuer.nombre, cuit,
            estado: 'pendiente', monto_pagado: 0, monto_restante: fields.monto, historial_pagos: [],
        });
        return { payment, created: true };
    } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        const payment = await payments.findById(paymentId);
        if (!payment) throw error;
        return { payment, created: false };
    }
}
