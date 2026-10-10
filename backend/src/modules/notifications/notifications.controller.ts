import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/authMiddleware';
import { AppError } from '../../shared/errors/AppError';
import { NotificationService } from './notifications.service';

const service = new NotificationService();
export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { res.json({ status: 'success', data: await service.getNotifications(req.user!.userId!, req.user!.permisos || []) }); }
    catch (error) { next(error); }
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
