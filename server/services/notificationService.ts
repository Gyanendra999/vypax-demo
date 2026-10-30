import { db, NotificationRecord } from '../db/database';

export class NotificationService {
  public listNotifications(workspaceId: string, userId?: string): NotificationRecord[] {
    return Array.from(db.notifications.values())
      .filter((n) => n.workspaceId === workspaceId && (!userId || n.userId === userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(params: {
    workspaceId: string;
    userId?: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }): NotificationRecord {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const notif: NotificationRecord = {
      id,
      workspaceId: params.workspaceId,
      userId: params.userId || 'user-aarav-001',
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      isRead: false,
      channel: 'in_app',
      deliveryStatus: 'delivered',
      createdAt: new Date().toISOString(),
    };

    db.notifications.set(id, notif);
    return notif;
  }

  public markAsRead(notificationId: string) {
    const notif = db.notifications.get(notificationId);
    if (notif) {
      notif.isRead = true;
    }
  }

  public markAllAsRead(workspaceId: string, userId?: string) {
    Array.from(db.notifications.values()).forEach((n) => {
      if (n.workspaceId === workspaceId && (!userId || n.userId === userId)) {
        n.isRead = true;
      }
    });
  }
}

export const notificationService = new NotificationService();
