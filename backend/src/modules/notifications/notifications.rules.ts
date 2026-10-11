import mongoose, { Schema } from 'mongoose';
import { tenantContext } from '../../shared/tenant';
import { AppError } from '../../shared/errors/AppError';
import { definicionesPerfiles } from '../usuarios/perfiles.service';

export const notificationOptions = [
    { type: 'LICENCIA', label: 'Vencimiento de licencias', permission: 'choferes' },
    { type: 'SEGURO', label: 'Vencimiento de seguros', permission: 'camiones' },
    { type: 'COBRANZA', label: 'Cobranzas por vencer y vencidas', permission: 'facturacion' },
    { type: 'PAGO', label: 'Pagos por vencer y vencidos', permission: 'facturacion' },
    { type: 'VIAJE_ESTADO', label: 'Cambio de estado de un viaje', permission: 'viajes' },
];
const schema = new Schema({
    empresaId: { type: String, required: true },
    type: { type: String, required: true, enum: notificationOptions.map(option => option.type) },
    name: { type: String, required: true, maxlength: 100 },
    profiles: { type: [String], required: true },
    active: { type: Boolean, default: true },
    allProfiles: { type: Boolean, default: false },
    channels: { type: [String], enum: ['web', 'mobile'], default: ['web'] },
}, { timestamps: true });
schema.index({ empresaId: 1, type: 1 });
export const NotificationRule = mongoose.model('NotificationRule', schema);
export function companyScope() {
    const empresaId = tenantContext.getStore()?.empresaId;
    if (!empresaId) throw new AppError('Seleccioná una empresa operadora', 403);
    return empresaId;
}
export async function listRules() {
    const empresaId = companyScope();
    const existing = await NotificationRule.find({ empresaId });
    if (notificationOptions.every(option => existing.some(rule => rule.type === option.type))) return existing;
    const definitions = await definicionesPerfiles(empresaId);
    for (const option of notificationOptions) {
        if (existing.some(rule => rule.type === option.type)) continue;
        await NotificationRule.updateOne({ empresaId, type: option.type }, { $setOnInsert: {
            name: option.label, profiles: definitions.filter(profile => profile.activo && profile.permisos.includes(option.permission)).map(profile => profile.perfil),
            active: true, channels: ['web'],
        } }, { upsert: true });
    }
    return NotificationRule.find({ empresaId }).sort({ name: 1 });
}
export async function writeRule(id: string | undefined, data: any) {
    const empresaId = companyScope();
    const option = notificationOptions.find(option => option.type === data.type);
    if (!option || typeof data.name !== 'string' || !data.name.trim() || data.name.length > 100 || typeof data.active !== 'boolean' ||
        !Array.isArray(data.profiles) || (!data.allProfiles && !data.profiles.length) || !Array.isArray(data.channels) || !data.channels.length || data.channels.some((channel: unknown) => !['web', 'mobile'].includes(channel as string))) {
        throw new AppError('Completá nombre, evento, perfiles y canales válidos', 400);
    }
    const definitions = await definicionesPerfiles(empresaId);
    if (data.profiles.some((code: unknown) => !definitions.some(profile => profile.perfil === code && profile.activo))) {
        throw new AppError('Seleccioná perfiles activos de tu empresa', 400);
    }
    const values = { name: data.name.trim(), type: option.type, profiles: [...new Set(data.profiles)], channels: [...new Set(data.channels)], active: data.active, allProfiles: data.allProfiles === true };
    if (id) {
        if (!mongoose.isValidObjectId(id)) throw new AppError('Regla inválida', 400);
        const result = await NotificationRule.findOneAndUpdate({ _id: id, empresaId }, { $set: values }, { new: true, runValidators: true });
        if (!result) throw new AppError('Regla no encontrada', 404);
        return result;
    }
    return NotificationRule.create({ empresaId, ...values });
}
