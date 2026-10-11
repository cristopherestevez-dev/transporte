import { NotificationModel, INotification } from './notifications.model';
import { allowedNotificationTypes } from './notifications.preferences';

function visible(userId: string, permissions: string[]) {
    const types = allowedNotificationTypes(permissions);
    return { type: { $in: types }, $or: [{ userId }, { userId: { $exists: false } }, { userId: null }] };
}
export class NotificationRepository {
    async create(data: Partial<INotification>): Promise<INotification> { return NotificationModel.create(data); }
    async findByUserOrRole(userId: string, permissions: string[]): Promise<INotification[]> {
        return NotificationModel.find({ ...visible(userId, permissions), readBy: { $ne: userId } }).sort({ createdAt: -1 });
    }
    async findExisting(type: string, resourceId: string): Promise<INotification | null> { return NotificationModel.findOne({ type, resourceId }); }
    async markAsRead(id: string, userId: string, permissions: string[]): Promise<INotification | null> {
        return NotificationModel.findOneAndUpdate({ _id: id, ...visible(userId, permissions) }, { $addToSet: { readBy: userId } }, { new: true });
    }
    async deleteForAll(userId: string, permissions: string[]): Promise<void> {
        await NotificationModel.updateMany(visible(userId, permissions), { $addToSet: { readBy: userId } });
    }
    async deleteInactive(types: string[], activeResourceIds: string[]): Promise<void> {
        await NotificationModel.deleteMany({ type: { $in: types }, resourceId: { $nin: activeResourceIds } });
    }
}
