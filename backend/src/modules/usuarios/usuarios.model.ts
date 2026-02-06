import mongoose, { Schema, Document } from 'mongoose';

export interface IUsuario extends Document {
    email: string;
    nombre: string;
    imagen?: string;
    perfil: 'operador_logistico' | 'operador_administrativo' | 'operador_seguridad' | null;
    permisos: string[];
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UsuarioSchema = new Schema<IUsuario>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        nombre: {
            type: String,
            required: true,
            trim: true,
        },
        imagen: {
            type: String,
            default: null,
        },
        perfil: {
            type: String,
            enum: ['operador_logistico', 'operador_administrativo', 'operador_seguridad', null],
            default: null,
        },
        permisos: {
            type: [String],
            default: [],
        },
        activo: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Definir permisos por perfil
export const PERMISOS_POR_PERFIL = {
    operador_logistico: ['dashboard', 'camiones', 'viajes', 'choferes', 'cotizador', 'empresas'],
    operador_administrativo: ['dashboard', 'cotizador', 'facturacion', 'empresas'],
    operador_seguridad: ['dashboard', 'configuracion'],
};

export const Usuario = mongoose.model<IUsuario>('Usuario', UsuarioSchema);
