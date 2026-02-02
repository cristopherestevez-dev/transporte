import mongoose, { Schema, Document } from 'mongoose';

export interface IProveedor extends Document {
    nombre: string;
    cuil_cuit: string;
    tipo: 'persona juridica' | 'persona fisica' | 'PERSONA_FISICA' | 'EMPRESA';
    direccion?: string;
    telefono?: string;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProveedorSchema: Schema = new Schema(
    {
        nombre: { type: String, required: true },
        cuil_cuit: { type: String, required: true },
        tipo: { type: String, required: true },
        direccion: { type: String },
        telefono: { type: String },
        email: { type: String },
    },
    { timestamps: true, collection: 'proveedores' }
);

export const ProveedorModel = mongoose.model<IProveedor>('Proveedor', ProveedorSchema);

