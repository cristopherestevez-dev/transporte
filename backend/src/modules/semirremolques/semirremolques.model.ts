import mongoose, { Schema, Document } from 'mongoose';

export interface ISemirremolque extends Document {
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    seguro: string;
    vencimiento_seguro?: string;
    numero_chasis?: string;
    numero_ejes?: number;
    createdAt: Date;
    updatedAt: Date;
}

const SemirremolqueSchema: Schema = new Schema(
    {
        patente: { type: String, required: true },
        marca: { type: String, required: true },
        modelo: { type: String, required: true },
        anio: { type: Number, required: true },
        seguro: { type: String },
        vencimiento_seguro: { type: String },
        numero_chasis: { type: String },
        numero_ejes: { type: Number },
    },
    { timestamps: true, collection: 'semirremolques' }
);

export const SemirremolqueModel = mongoose.model<ISemirremolque>('Semirremolque', SemirremolqueSchema);
