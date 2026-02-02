import mongoose, { Schema, Document } from 'mongoose';

export interface ICamion extends Document {
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    seguro: string;
    vencimiento_seguro?: string;
    numero_chasis?: string;
    numero_motor?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CamionSchema: Schema = new Schema(
    {
        patente: { type: String, required: true },
        marca: { type: String, required: true },
        modelo: { type: String, required: true },
        anio: { type: Number, required: true },
        seguro: { type: String },
        vencimiento_seguro: { type: String },
        numero_chasis: { type: String },
        numero_motor: { type: String },
    },
    { timestamps: true, collection: 'camiones' }
);

export const CamionModel = mongoose.model<ICamion>('Camion', CamionSchema);
