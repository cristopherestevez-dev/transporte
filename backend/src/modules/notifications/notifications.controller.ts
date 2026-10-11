import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/authMiddleware';
import { AppError } from '../../shared/errors/AppError';
import { NotificationService } from './notifications.service';
import { getPreferences, savePreferences, saveRulePreferences } from './notifications.preferences';
import { listRules } from './notifications.rules';

const service = new NotificationService();
export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user!;
        const options = await getPreferences(user.userId!, user.role!, user.empresaId!, user.permisos || []);
        const notifications = await service.getNotifications(user.userId!, user.permisos || []);
        const rules = await listRules();
        res.json({ status: 'success', data: notifications.filter(notification => rules.some(rule => rule.type === notification.type && rule.active && rule.channels.includes('web') && (rule.allProfiles || rule.profiles.includes(user.role!)) && options.some(option => option.type === rule.type && option.enabled && (!('ruleId' in option) || option.ruleId === rule._id.toString())))) });
    }
    catch (error) { next(error); }
};
export const getNotificationPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user!;
        res.json({ status: 'success', data: await getPreferences(user.userId!, user.role!, user.empresaId!, user.permisos || []) });
    } catch (error) { next(error); }
};
export const updateNotificationPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user!;
        res.json({ status: 'success', data: await (req.body.enabledRuleIds !== undefined ? saveRulePreferences(user.userId!, user.role!, user.empresaId!, user.permisos || [], req.body.enabledRuleIds) : savePreferences(user.userId!, user.role!, user.empresaId!, user.permisos || [], req.body.enabledTypes)) });
    } catch (error) { next(error); }
};
export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const updated = await service.markAsRead(req.params.id, req.user!.userId!, req.user!.permisos || []);
        if (!updated) throw new AppError('Notificación no encontrada', 404);
        res.json({ status: 'success', data: updated });
    } catch (error) { next(error); }
};
export const clearAllNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await service.clearAll(req.user!.userId!, req.user!.permisos || []);
        res.status(204).send();
    } catch (error) { next(error); }
};
