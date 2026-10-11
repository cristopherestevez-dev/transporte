import mongoose, { Schema } from 'mongoose';
import { AppError } from '../../shared/errors/AppError';
import { listRules, notificationOptions } from './notifications.rules';
import { tenantContext } from '../../shared/tenant';
export { notificationOptions } from './notifications.rules';

export const allowedNotificationTypes = (permissions: string[]) => notificationOptions.filter(option => permissions.includes(option.permission)).map(option => option.type);

const schema = new Schema({
    userId: { type: String, required: true },
    perfil: { type: String, required: true },
    empresaId: { type: String, required: true },
    disabledTypes: { type: [String], default: [] },
    disabledRuleIds: { type: [String], default: [] },
});
schema.index({ userId: 1, perfil: 1, empresaId: 1 }, { unique: true });
export const Preferences = mongoose.model('NotificationPreferences', schema);

export async function getPreferences(userId: string, perfil: string, empresaId: string, permissions: string[]) {
    const saved = await Preferences.findOne({ userId, perfil, empresaId });
    const rules = tenantContext.getStore()?.empresaId ? await listRules() : null;
    if (rules) return rules.filter(rule => rule.active && (rule.allProfiles || rule.profiles.includes(perfil)) && notificationOptions.some(option => option.type === rule.type && permissions.includes(option.permission))).map(rule => ({
        ruleId: rule._id.toString(), type: rule.type, label: rule.name, permission: notificationOptions.find(option => option.type === rule.type)!.permission,
        enabled: !saved?.disabledTypes.includes(rule.type) && !saved?.disabledRuleIds?.includes(rule._id.toString()),
    }));
    return notificationOptions.filter(option => permissions.includes(option.permission)).map(option => ({
        ...option, enabled: !saved?.disabledTypes.includes(option.type),
    }));
}

export async function savePreferences(userId: string, perfil: string, empresaId: string, permissions: string[], enabledTypes: unknown) {
    const allowed = allowedNotificationTypes(permissions);
    if (!Array.isArray(enabledTypes) || enabledTypes.some(type => typeof type !== 'string' || !allowed.includes(type))) {
        throw new AppError('Tipos de notificación inválidos o sin permiso', 400);
    }
    const current = await Preferences.findOne({ userId, perfil, empresaId });
    const disabledTypes = [...(current?.disabledTypes || []).filter(type => !allowed.includes(type)), ...allowed.filter(type => !enabledTypes.includes(type))];
    await Preferences.findOneAndUpdate({ userId, perfil, empresaId }, { $set: { disabledTypes } }, { upsert: true, new: true });
    if (tenantContext.getStore()?.empresaId) {
        const { NotificationDelivery } = await import('./notifications.delivery');
        await NotificationDelivery.updateMany({ userId, perfil, empresaId, type: { $in: disabledTypes }, status: 'pending' }, { $set: { status: 'cancelled' } });
    }
    return getPreferences(userId, perfil, empresaId, permissions);
}

export async function saveRulePreferences(userId: string, perfil: string, empresaId: string, permissions: string[], enabledRuleIds: unknown) {
    const options = await getPreferences(userId, perfil, empresaId, permissions);
    const allowed = options.map(option => ('ruleId' in option ? option.ruleId : undefined)).filter(Boolean) as string[];
    if (!Array.isArray(enabledRuleIds) || enabledRuleIds.some(id => typeof id !== 'string' || !allowed.includes(id))) throw new AppError('Reglas inválidas o sin permiso', 400);
    const current = await Preferences.findOne({ userId, perfil, empresaId });
    const disabledRuleIds = [...(current?.disabledRuleIds || []).filter(id => !allowed.includes(id)), ...allowed.filter(id => !enabledRuleIds.includes(id))];
    const types = options.map(option => option.type);
    await Preferences.findOneAndUpdate({ userId, perfil, empresaId }, { $set: { disabledRuleIds, disabledTypes: (current?.disabledTypes || []).filter(type => !types.includes(type)) } }, { upsert: true });
    const updated = await getPreferences(userId, perfil, empresaId, permissions);
    const rules = await listRules();
    const disabledMobileTypes = [...new Set(types)].filter(type => !rules.some(rule => rule.type === type && rule.active && rule.channels.includes('mobile') && enabledRuleIds.includes(rule._id.toString())));
    const { NotificationDelivery } = await import('./notifications.delivery');
    await NotificationDelivery.updateMany({ userId, perfil, empresaId, type: { $in: disabledMobileTypes }, status: 'pending' }, { $set: { status: 'cancelled' } });
    return updated;
}
