import mongoose, { Schema, Document } from 'mongoose';

export interface IChofer extends Document {
    nombre: string;
    dni: string;
    telefono?: string;
    licencia?: string; // fecha vencimiento licencia
    createdAt: Date;
    updatedAt: Date;
}

const ChoferSchema: Schema = new Schema(
    {
        nombre: { type: String, required: true },
        dni: { type: String, required: true },
        telefono: { type: String },
        licencia: { type: String },
    },
    { timestamps: true, collection: 'choferes' }
);

export const ChoferModel = mongoose.model<IChofer>('Chofer', ChoferSchema);
