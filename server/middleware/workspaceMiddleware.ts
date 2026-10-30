import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { WorkspaceRecord, MembershipRecord } from '../types/backend';

declare global {
  namespace Express {
    interface Request {
      workspaceId?: string;
      workspace?: WorkspaceRecord;
      membership?: MembershipRecord;
    }
  }
}

export const requireWorkspace = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User must be authenticated to access a workspace.' });
  }

  // 1. Identify workspace ID from header, query parameter, or user default
  const requestedWorkspaceId =
    (req.headers['x-workspace-id'] as string) ||
    (req.query.workspaceId as string) ||
    'ws-default-001';

  const workspace = db.workspaces.get(requestedWorkspaceId);
  if (!workspace || !workspace.isActive) {
    return res.status(404).json({ error: 'Workspace not found or inactive.' });
  }

  // 2. Check if user is a member or platform super_admin
  const membershipKey = `mem-${requestedWorkspaceId}-${req.user.id}`;
  let membership = db.memberships.get(membershipKey);

  // If not direct member, check if user is super admin in any workspace
  if (!membership) {
    const isSuperAdmin = Array.from(db.memberships.values()).some(
      (m) => m.userId === req.user?.id && m.role === 'super_admin' && m.isActive
    );

    if (isSuperAdmin) {
      membership = {
        id: `super-${req.user.id}`,
        workspaceId: requestedWorkspaceId,
        userId: req.user.id,
        role: 'super_admin',
        title: 'Platform Super Admin',
        department: 'Governance',
        isActive: true,
        joinedAt: new Date().toISOString(),
      };
    }
  }

  if (!membership || !membership.isActive) {
    return res.status(403).json({
      error: 'Forbidden: You do not have active membership in this workspace.',
    });
  }

  req.workspaceId = requestedWorkspaceId;
  req.workspace = workspace;
  req.membership = membership;

  next();
};
