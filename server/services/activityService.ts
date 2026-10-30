import { db } from '../db/database';
import { ActivityEvent } from '../../src/types/trade';

export class ActivityService {
  public listActivities(workspaceId: string, limit = 50): ActivityEvent[] {
    return Array.from(db.activities.values())
      .filter((a) => a.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  public logActivity(event: {
    workspaceId: string;
    shipmentId?: string;
    type: ActivityEvent['type'];
    title: string;
    detail: string;
    actor?: string;
    actorEmail?: string;
  }): ActivityEvent {
    const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newAct: ActivityEvent & { workspaceId: string } = {
      id,
      workspaceId: event.workspaceId,
      timestamp: new Date().toISOString(),
      timeDisplay: 'Just now',
      shipmentId: event.shipmentId,
      type: event.type,
      actor: event.actor || 'Operations Team',
      title: event.title,
      detail: event.detail,
    };

    db.activities.set(id, newAct);
    return newAct;
  }
}

export const activityService = new ActivityService();

export { notificationService } from './notificationService';
