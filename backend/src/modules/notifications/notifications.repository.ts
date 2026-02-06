import { NotificationModel, INotification } from './notifications.model';

export class NotificationRepository {
    async create(data: Partial<INotification>): Promise<INotification> {
        return await NotificationModel.create(data);
    }

    async findByUserOrRole(userId: string, role?: string): Promise<INotification[]> {
        const query: any = {
            $or: [{ userId }]
        };

        if (role) {
            query.$or.push({ role });
        }

        return await NotificationModel.find(query).sort({ createdAt: -1 });
    }

    async findExisting(type: string, resourceId: string): Promise<INotification | null> {
        return await NotificationModel.findOne({ type, resourceId });
    }

    async markAsRead(id: string): Promise<INotification | null> {
        return await NotificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
    }

    async deleteForAll(userId: string, role?: string): Promise<void> {
        const query: any = {
            $or: [{ userId }]
        };
        if (role) {
            query.$or.push({ role });
        }
        await NotificationModel.deleteMany(query);
    }
}
