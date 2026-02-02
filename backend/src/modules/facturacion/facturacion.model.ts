import mongoose, { Schema, Document } from 'mongoose';

export interface IFacturacion extends Document {
    fecha: string;
    razon_social: string;
    cuit: string;
    tipo_comprobante: string;
    numero_comprobante: string;
    estado: 'pendiente' | 'cobrado' | 'pagado' | 'vencido';
    monto: number;
    plazo: number;
    createdAt: Date;
    updatedAt: Date;
}

const facturacionFields = {
    fecha: { type: String, required: true },
    razon_social: { type: String, required: true },
    cuit: { type: String, required: true },
    tipo_comprobante: { type: String, required: true },
    numero_comprobante: { type: String, required: true },
    estado: { type: String, enum: ['pendiente', 'cobrado', 'pagado', 'vencido'], default: 'pendiente' },
    monto: { type: Number, required: true },
    plazo: { type: Number, default: 30 },
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
