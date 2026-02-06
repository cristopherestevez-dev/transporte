import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId?: string;
    role?: string;
    type: 'LICENCIA' | 'SEGURO' | 'COBRANZA' | 'PAGO' | 'SYSTEM';
    title: string;
    message: string;
    resourceId?: string;
    link?: string;
    isRead: boolean;
    severity: 'info' | 'warning' | 'danger';
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    userId: { type: String },
    role: { type: String },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    resourceId: { type: String },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    severity: { type: String, default: 'info' },
    createdAt: { type: Date, default: Date.now }
});

// Index for efficient querying by user/role and read status
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ role: 1, isRead: 1 });
NotificationSchema.index({ type: 1, resourceId: 1 }); // Prevent duplicates

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
