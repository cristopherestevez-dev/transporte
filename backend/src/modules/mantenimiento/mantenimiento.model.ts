import mongoose, { Schema, Document } from 'mongoose';

export interface IMantenimiento extends Document {
    vehiculoId: mongoose.Types.ObjectId;
    fecha: string;
    km: number;
    patente: string;
    // Aceite
    aceite_cambio: boolean;
    aceite_marca: string;
    aceite_codigo: string;
    aceite_precioxl: number;
    aceite_litros: number;
    // Filtros
    filtro_aceite_cambio: boolean;
    filtro_aceite_marca: string;
    filtro_aceite_codigo: string;
    filtro_aceite_precio: number;
    filtro_gasoil_cambio: boolean;
    filtro_gasoil_marca: string;
    filtro_gasoil_codigo: string;
    filtro_gasoil_precio: number;
    trampa_agua_cambio: boolean;
    trampa_agua_marca: string;
    trampa_agua_codigo: string;
    trampa_agua_precio: number;
    filtro_aire_cambio: boolean;
    filtro_aire_marca: string;
    filtro_aire_codigo: string;
    filtro_aire_precio: number;
    secado_aire_cambio: boolean;
    secado_aire_marca: string;
    secado_aire_codigo: string;
    secado_aire_precio: number;
    filtro_habitaculo_cambio: boolean;
    filtro_habitaculo_marca: string;
    filtro_habitaculo_codigo: string;
    filtro_habitaculo_precio: number;
    // Motor
    bomba_agua_cambio: boolean;
    bomba_agua_marca: string;
    bomba_agua_codigo: string;
    bomba_agua_precio: number;
    valvulas_cambio: boolean;
    valvulas_marca: string;
    valvulas_regular: boolean;
    valvulas_precio: number;
    toberas_cambio: boolean;
    toberas_marca: string;
    toberas_codigo: string;
    toberas_precio: number;
    // Cubiertas
    cubiertas_cambio: boolean;
    cubiertas_marca: string;
    cubiertas_cantidad: number;
    cubiertas_precio_unit: number;
    // Extras
    extras_descripcion: string;
    extras_precio: number;
    createdAt: Date;
    updatedAt: Date;
}

const MantenimientoSchema: Schema = new Schema(
    {
        vehiculoId: { type: Schema.Types.ObjectId, required: true, index: true },
        fecha: { type: String, required: true },
        km: { type: Number, default: 0 },
        patente: { type: String },
        // Aceite
        aceite_cambio: { type: Boolean, default: false },
        aceite_marca: { type: String },
        aceite_codigo: { type: String },
        aceite_precioxl: { type: Number },
        aceite_litros: { type: Number },
        // Filtros
        filtro_aceite_cambio: { type: Boolean, default: false },
        filtro_aceite_marca: { type: String },
        filtro_aceite_codigo: { type: String },
        filtro_aceite_precio: { type: Number },
        filtro_gasoil_cambio: { type: Boolean, default: false },
        filtro_gasoil_marca: { type: String },
        filtro_gasoil_codigo: { type: String },
        filtro_gasoil_precio: { type: Number },
        trampa_agua_cambio: { type: Boolean, default: false },
        trampa_agua_marca: { type: String },
        trampa_agua_codigo: { type: String },
        trampa_agua_precio: { type: Number },
        filtro_aire_cambio: { type: Boolean, default: false },
        filtro_aire_marca: { type: String },
        filtro_aire_codigo: { type: String },
        filtro_aire_precio: { type: Number },
        secado_aire_cambio: { type: Boolean, default: false },
        secado_aire_marca: { type: String },
        secado_aire_codigo: { type: String },
        secado_aire_precio: { type: Number },
        filtro_habitaculo_cambio: { type: Boolean, default: false },
        filtro_habitaculo_marca: { type: String },
        filtro_habitaculo_codigo: { type: String },
        filtro_habitaculo_precio: { type: Number },
        // Motor
        bomba_agua_cambio: { type: Boolean, default: false },
        bomba_agua_marca: { type: String },
        bomba_agua_codigo: { type: String },
        bomba_agua_precio: { type: Number },
        valvulas_cambio: { type: Boolean, default: false },
        valvulas_marca: { type: String },
        valvulas_regular: { type: Boolean, default: false },
        valvulas_precio: { type: Number },
        toberas_cambio: { type: Boolean, default: false },
        toberas_marca: { type: String },
        toberas_codigo: { type: String },
        toberas_precio: { type: Number },
        // Cubiertas
        cubiertas_cambio: { type: Boolean, default: false },
        cubiertas_marca: { type: String },
        cubiertas_cantidad: { type: Number },
        cubiertas_precio_unit: { type: Number },
        // Extras
        extras_descripcion: { type: String },
        extras_precio: { type: Number },
    },
    { timestamps: true, collection: 'mantenimientos' }
);

MantenimientoSchema.index({ fecha: 1 });
MantenimientoSchema.index({ km: 1 });

export const MantenimientoModel = mongoose.model<IMantenimiento>('Mantenimiento', MantenimientoSchema);
