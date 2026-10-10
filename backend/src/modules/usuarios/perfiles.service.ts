import mongoose, { Schema } from 'mongoose';
import { PERMISOS_POR_PERFIL, Perfil, Usuario } from './usuarios.model';
import { AppError } from '../../shared/errors/AppError';
import { tenantContext } from '../../shared/tenant';

export const PERMISOS_DISPONIBLES = ['dashboard', 'camiones', 'viajes', 'choferes', 'cotizador', 'empresas', 'facturacion', 'configuracion', 'mis-viajes', 'mi-camion'] as const;
const labels: Record<string, string> = { operador_logistico: 'Operador Logístico', operador_administrativo: 'Operador Administrativo', operador_seguridad: 'Operador de Seguridad', chofer: 'Chofer' };
const profileSchema = new Schema({
    perfil: { type: String, required: true, unique: true },
    codigo: String,
    empresaId: String,
    nombre: String,
    activo: { type: Boolean, default: true },
    permisos: { type: [String], enum: PERMISOS_DISPONIBLES, default: [] },
    actualizadoPor: { type: String, required: true },
}, { timestamps: true, collection: 'perfiles' });
export const PerfilModel = mongoose.model('Perfil', profileSchema);
const scope = (empresaId?: string) => empresaId || tenantContext.getStore()?.empresaId;
const storageKey = (perfil: string) => `${scope() || 'global'}:${perfil}`;

export async function definicionesPerfiles(empresaId?: string) {
    const empresa = scope(empresaId);
    const records = await PerfilModel.find({ empresaId: empresa || { $exists: false } });
    const map = Object.fromEntries(Object.entries(PERMISOS_POR_PERFIL).map(([perfil, permisos]) => [perfil, { perfil, nombre: labels[perfil], permisos: [...permisos], activo: true }]));
    for (const record of records) {
        const key = record.codigo || record.perfil;
        map[key] = { perfil: key, nombre: record.nombre || labels[key] || key, permisos: [...record.permisos], activo: record.activo !== false };
    }
    return Object.values(map);
}
export async function permisosPorPerfil(empresaId?: string): Promise<Record<Perfil, string[]>> {
    const definitions = await definicionesPerfiles(empresaId);
    const map = Object.fromEntries(definitions.filter(profile => profile.activo).map(profile => [profile.perfil, profile.permisos]));
    if (!map.operador_seguridad) map.operador_seguridad = ['configuracion'];
    if (!map.operador_seguridad.includes('configuracion')) map.operador_seguridad.push('configuracion');
    if (map.chofer) map.chofer = map.chofer.filter(permission => ['mis-viajes', 'mi-camion'].includes(permission));
    return map;
}
function validate(perfil: string, permisos: unknown) {
    if (!/^[a-z][a-z0-9_]{1,63}$/.test(perfil)) throw new AppError('Código de perfil inválido', 400);
    if (!Array.isArray(permisos) || permisos.length > 10 || permisos.some(value => typeof value !== 'string' || !PERMISOS_DISPONIBLES.includes(value as any))) throw new AppError('Permisos inválidos', 400);
    if (perfil === 'operador_seguridad' && !permisos.includes('configuracion')) throw new AppError('Seguridad debe conservar Configuración', 400);
    if (perfil === 'chofer' && permisos.some(value => !['mis-viajes', 'mi-camion'].includes(value))) throw new AppError('Chofer solo puede acceder a sus viajes y su camión', 400);
    return [...new Set(permisos)] as string[];
}
export async function actualizarPermisosPerfil(perfil: string, permisos: unknown, email: string, nombre?: string) {
    const values = validate(perfil, permisos);
    if (!(await definicionesPerfiles()).some(profile => profile.perfil === perfil)) throw new AppError('Perfil no encontrado', 404);
    if (nombre !== undefined && (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 100)) throw new AppError('Nombre de perfil inválido', 400);
    const record = await PerfilModel.findOneAndUpdate({ perfil: storageKey(perfil) }, { $set: { codigo: perfil, empresaId: scope(), permisos: values, ...(nombre ? { nombre: nombre.trim() } : {}), actualizadoPor: email } }, { new: true, upsert: true, runValidators: true });
    return { ...record!.toObject(), perfil };
}
export async function crearPerfil(perfil: string, nombre: string, permisos: unknown, email: string) {
    const values = validate(perfil, permisos);
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 100) throw new AppError('Nombre requerido', 400);
    if ((await definicionesPerfiles()).some(profile => profile.perfil === perfil)) throw new AppError('El perfil ya existe', 409);
    return PerfilModel.create({ perfil: storageKey(perfil), codigo: perfil, empresaId: scope(), nombre: nombre.trim(), permisos: values, actualizadoPor: email });
}
export async function eliminarPerfil(perfil: string, email: string) {
    if (perfil === 'operador_seguridad') throw new AppError('No se puede dar de baja el perfil de seguridad', 400);
    const filter = scope() ? { empresaId: scope() } : {};
    if (await Usuario.exists({ ...filter, $or: [{ perfiles: perfil }, { perfil }] })) throw new AppError('Quitá este perfil de los usuarios antes de darlo de baja', 409);
    if (!(await definicionesPerfiles()).some(profile => profile.perfil === perfil && profile.activo)) throw new AppError('Perfil no encontrado', 404);
    await PerfilModel.findOneAndUpdate({ perfil: storageKey(perfil) }, { $set: { codigo: perfil, empresaId: scope(), activo: false, permisos: [], actualizadoPor: email } }, { upsert: true, runValidators: true });
}
