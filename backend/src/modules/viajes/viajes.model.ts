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
};

const ViajeNacionalSchema: Schema = new Schema(viajeFields, { timestamps: true, collection: 'viajesNacionales' });
const ViajeInternacionalSchema: Schema = new Schema(viajeFields, { timestamps: true, collection: 'viajesInternacionales' });

export const ViajeNacionalModel = mongoose.model<IViaje>('ViajeNacional', ViajeNacionalSchema);
export const ViajeInternacionalModel = mongoose.model<IViaje>('ViajeInternacional', ViajeInternacionalSchema);
