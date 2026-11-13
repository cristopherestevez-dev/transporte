import { numeroOperativo } from '../../shared/numeroOperativo';
import mongoose, { Schema, Document } from 'mongoose';

export interface IChofer extends Document {
    numeroOperativo?: number;
    nombre: string;
    dni: string;
    camionId?: string;
    telefono?: string;
    licencia?: string; // fecha vencimiento licencia
    createdAt: Date;
    updatedAt: Date;
}

const ChoferSchema: Schema = new Schema(
    {
        nombre: { type: String, required: true },
        dni: { type: String, required: true },
        camionId: { type: String },
        telefono: { type: String },
        licencia: { type: String },
    },
    { timestamps: true, collection: 'choferes' }
);

numeroOperativo(ChoferSchema);
export const ChoferModel = mongoose.model<IChofer>('Chofer', ChoferSchema);
