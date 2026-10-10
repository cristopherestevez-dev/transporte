import mongoose, { Schema, Document } from 'mongoose';

export interface IFacturacion extends Document {
    fecha: string;
    razon_social: string;
    cuit: string;
    tipo_comprobante: string;
    numero_comprobante: string;
    estado: 'pendiente' | 'cobrado' | 'pagado' | 'vencido' | 'pago_parcial';
    moneda?: 'ARS' | 'USD' | 'CLP';
    monto: number;
    plazo: number;
    monto_pagado?: number;
    monto_restante?: number;
    historial_pagos?: any[];
    metodos_pago?: any;
    cheques?: any[];
    orden_pago_pdf?: string;
    orden_pago_url?: string;
    createdAt: Date;
    updatedAt: Date;
}

const facturacionFields = {
    fecha: { type: String, required: true },
    razon_social: { type: String, required: true },
    cuit: { type: String, required: true },
    tipo_comprobante: { type: String, required: true },
    numero_comprobante: { type: String, required: true },
    estado: { type: String, enum: ['pendiente', 'cobrado', 'pagado', 'vencido', 'pago_parcial'], default: 'pendiente' },
    moneda: { type: String, enum: ['ARS', 'USD', 'CLP'] },
    monto: { type: Number, required: true, min: 0 },
    plazo: { type: Number, default: 30, min: 0 },
    monto_pagado: { type: Number, min: 0 },
    monto_restante: { type: Number, min: 0 },
    historial_pagos: { type: [Schema.Types.Mixed], default: [] },
    metodos_pago: { type: Schema.Types.Mixed },
    cheques: { type: [Schema.Types.Mixed], default: [] },
    orden_pago_pdf: { type: String },
    orden_pago_url: { type: String },
};

// Cobranzas - schemas separados para cada colección
const CobranzaNacionalSchema: Schema = new Schema(facturacionFields, { timestamps: true, collection: 'cobranzasNacionales' });
const CobranzaInternacionalSchema: Schema = new Schema(facturacionFields, { timestamps: true, collection: 'cobranzasInternacionales' });

// Pagos - schemas separados para cada colección
const PagoNacionalSchema: Schema = new Schema(facturacionFields, { timestamps: true, collection: 'pagosNacionales' });
const PagoInternacionalSchema: Schema = new Schema(facturacionFields, { timestamps: true, collection: 'pagosInternacionales' });

// Cobranzas
export const CobranzaNacionalModel = mongoose.model<IFacturacion>('CobranzaNacional', CobranzaNacionalSchema);
export const CobranzaInternacionalModel = mongoose.model<IFacturacion>('CobranzaInternacional', CobranzaInternacionalSchema);

// Pagos
export const PagoNacionalModel = mongoose.model<IFacturacion>('PagoNacional', PagoNacionalSchema);
export const PagoInternacionalModel = mongoose.model<IFacturacion>('PagoInternacional', PagoInternacionalSchema);
