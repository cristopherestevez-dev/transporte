import { Request, Response } from 'express';
import { NotificationService } from './notifications.service';

const notificationService = new NotificationService();

export const getNotifications = async (req: Request, res: Response) => {
    try {
        // Assuming user info is attached to req by auth middleware
        const userId = (req as any).user?.userId || 'unknown'; 
        const role = (req as any).user?.role || 'admin'; // Fallback or strict

        const notifications = await notificationService.getNotifications(userId, role);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updated = await notificationService.markAsRead(id);
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error marking notification as read', error });
    }
};

export const clearAllNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || 'unknown';
        const role = (req as any).user?.role;
        await notificationService.clearAll(userId, role);
        res.status(200).json({ message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing notifications', error });
    }
};
