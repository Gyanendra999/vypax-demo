import { Request, Response, NextFunction } from 'express';
import { Permission, ROLE_PERMISSIONS } from '../types/backend';

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.membership) {
      return res.status(403).json({ error: 'Access denied: Workspace membership required.' });
    }

    const userRole = req.membership.role;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        error: `Permission denied: Role '${userRole}' lacks '${permission}' authorization in this workspace.`,
        requiredPermission: permission,
        role: userRole,
      });
    }

    next();
  };
};
