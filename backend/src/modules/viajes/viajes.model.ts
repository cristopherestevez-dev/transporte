import mongoose, { Schema, Document } from 'mongoose';

export interface IViaje extends Document {
    origen: string;
    destino: string;
    fecha_salida?: string;
    fecha_llegada?: string;
    proveedorId?: string;
    proveedor?: string;
    asignadoId?: string;
    tipoAsignacion?: 'chofer' | 'fletero';
    carga?: string;
    tipoCarga?: 'contenedor' | 'byl';
    estado: 'pendiente' | 'en_transito' | 'finalizado' | 'cancelado';
    tarifaTotalAr?: number;
    tarifaChoferPorcentaje?: number;
    tarifaChoferAr?: number;
    tarifaTotalUsd?: number;
    tarifaChoferUsd?: number;
    tarifaChoferUsdAr?: number;
    estadiaCh?: number;
    estadiaAr?: number;
    totalChofer?: number;
    viaticoChileno?: number;
    peajeCh?: number;
    devolCh?: number;
    restoCh?: number;
    viaticoArgentino?: number;
    peajeAr?: number;
    devolAr?: number;
    restoAr?: number;
    adelantoMonto?: number;
    adelantoMoneda?: string;
    adelantoAr?: number;
    pago?: number;
    subtotal?: number;
    createdAt: Date;
    updatedAt: Date;
}

const viajeFields = {
    origen: { type: String, required: true },
    destino: { type: String, required: true },
    fecha_salida: { type: String },
    fecha_llegada: { type: String },
    proveedorId: { type: String },
    proveedor: { type: String },
    asignadoId: { type: String },
    tipoAsignacion: { type: String, enum: ['chofer', 'fletero'] },
    carga: { type: String },
    tipoCarga: { type: String, enum: ['contenedor', 'byl'] },
    estado: { type: String, enum: ['pendiente', 'en_transito', 'finalizado', 'cancelado'], default: 'pendiente' },
    tarifaTotalAr: { type: Number },
    tarifaChoferPorcentaje: { type: Number },
    tarifaChoferAr: { type: Number },
    tarifaTotalUsd: { type: Number },
    tarifaChoferUsd: { type: Number },
    tarifaChoferUsdAr: { type: Number },
    estadiaCh: { type: Number },
    estadiaAr: { type: Number },
    totalChofer: { type: Number },
    viaticoChileno: { type: Number },
    peajeCh: { type: Number },
    devolCh: { type: Number },
    restoCh: { type: Number },
    viaticoArgentino: { type: Number },
    peajeAr: { type: Number },
    devolAr: { type: Number },
    restoAr: { type: Number },
    adelantoMonto: { type: Number },
    adelantoMoneda: { type: String },
    adelantoAr: { type: Number },
    pago: { type: Number },
    subtotal: { type: Number },
};

const ViajeNacionalSchema: Schema = new Schema(viajeFields, { timestamps: true, collection: 'viajesNacionales' });
const ViajeInternacionalSchema: Schema = new Schema(viajeFields, { timestamps: true, collection: 'viajesInternacionales' });

export const ViajeNacionalModel = mongoose.model<IViaje>('ViajeNacional', ViajeNacionalSchema);
export const ViajeInternacionalModel = mongoose.model<IViaje>('ViajeInternacional', ViajeInternacionalSchema);
