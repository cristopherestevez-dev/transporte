import mongoose, { Schema } from 'mongoose';
import { Usuario, perfilesAsignados } from '../usuarios/usuarios.model';
import { permisosPorPerfil } from '../usuarios/perfiles.service';
import { listRules, companyScope, notificationOptions } from './notifications.rules';
import { Preferences } from './notifications.preferences';
import { INotification } from './notifications.model';

// Durable outbox for a future push worker. No device or push provider is configured yet.
const schema = new Schema({
    empresaId: { type: String, required: true }, userId: { type: String, required: true },
    perfil: { type: String, required: true }, notificationId: { type: String, required: true },
    channel: { type: String, default: 'mobile' }, status: { type: String, enum: ['pending', 'sent', 'failed', 'cancelled'], default: 'pending' },
    title: String, message: String, link: String, type: String,
    attempts: { type: Number, default: 0 }, availableAt: { type: Date, default: Date.now },
}, { timestamps: true });
schema.index({ notificationId: 1, userId: 1, perfil: 1, channel: 1 }, { unique: true });
schema.index({ status: 1, availableAt: 1 });
export const NotificationDelivery = mongoose.model('NotificationDelivery', schema);

export async function cancelUnavailableDeliveries(type: string) {
    const empresaId = companyScope();
    const rules = (await listRules()).filter(rule => rule.type === type && rule.active && rule.channels.includes('mobile'));
    const option = notificationOptions.find(option => option.type === type);
    const permissions = await permisosPorPerfil(empresaId);
    const profiles = Object.keys(permissions).filter(perfil => option && permissions[perfil].includes(option.permission) && rules.some(rule => rule.allProfiles || rule.profiles.includes(perfil)));
    await NotificationDelivery.updateMany({ empresaId, type, status: 'pending', perfil: { $nin: profiles } }, { $set: { status: 'cancelled' } });
}

export async function queueMobileDeliveries(notification: INotification) {
    const empresaId = companyScope();
    const rules = (await listRules()).filter(rule => rule.type === notification.type && rule.active && rule.channels.includes('mobile'));
    const option = notificationOptions.find(option => option.type === notification.type);
    if (!rules.length || !option) return;
    const permissions = await permisosPorPerfil(empresaId);
    const users = await Usuario.find({ empresaId, activo: true, estado: 'aprobado', ...(notification.userId ? { _id: notification.userId } : {}) });
    for (const user of users) {
        for (const perfil of perfilesAsignados(user).filter(perfil => rules.some(rule => rule.allProfiles || rule.profiles.includes(perfil)) && permissions[perfil]?.includes(option.permission))) {
            const preferences = await Preferences.findOne({ empresaId, userId: user._id.toString(), perfil });
            if (preferences?.disabledTypes.includes(notification.type)) continue;
            if (!rules.some(rule => (rule.allProfiles || rule.profiles.includes(perfil)) && !preferences?.disabledRuleIds?.includes(rule._id.toString()))) continue;
            const key = { notificationId: notification._id.toString(), userId: user._id.toString(), perfil, channel: 'mobile' };
            await NotificationDelivery.updateOne(key, { $setOnInsert: {
                ...key, empresaId, title: notification.title, message: notification.message, link: notification.link, type: notification.type, status: 'pending',
            } }, { upsert: true });
        }
    }
}
