import mongoose, { Schema, Document } from 'mongoose';

export interface IUsuario extends Document {
    usuario?: string;
    email: string;
    nombre: string;
    imagen?: string;
    passwordHash?: string;
    perfil: string | null;
    empresaId?: string;
    choferId?: string;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    perfiles: Perfil[];
    permisos: string[];
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UsuarioSchema = new Schema<IUsuario>(
    {
        usuario: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
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
        choferId: { type: String },
        empresaId: { type: String, index: true },
        estado: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'aprobado' },
        passwordHash: { type: String, select: false },
        imagen: {
            type: String,
            default: null,
        },
        perfil: {
            type: String,
            default: null,
        },
        perfiles: {
            type: [String],
            default: [],
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
        toJSON: { transform: (_doc, result) => { delete result.passwordHash; return result; } },
        toObject: { transform: (_doc, result) => { delete result.passwordHash; return result; } },
    }
);

// Definir permisos por perfil
export const PERMISOS_POR_PERFIL = {
    superadmin: ['configuracion'],
    operador_logistico: ['dashboard', 'camiones', 'viajes', 'choferes', 'cotizador', 'empresas'],
    operador_administrativo: ['dashboard', 'cotizador', 'facturacion', 'empresas'],
    operador_seguridad: ['dashboard', 'configuracion'],
    chofer: ['mis-viajes', 'mi-camion'],
};

export const Usuario = mongoose.model<IUsuario>('Usuario', UsuarioSchema);

export type Perfil = string;

export function perfilesAsignados(usuario: { perfiles?: string[]; perfil?: string | null }): Perfil[] {
    const assigned = usuario.perfiles?.length ? usuario.perfiles : usuario.perfil ? [usuario.perfil] : [];
    return [...new Set(assigned)].filter((perfil): perfil is Perfil => typeof perfil === 'string' && /^[a-z][a-z0-9_]{1,63}$/.test(perfil));
}
