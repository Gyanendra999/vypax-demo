import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { AuthUser } from '../types/backend';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'vyaapx-super-secure-production-trade-jwt-secret-key-2026';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && (req.cookies.vyaapx_token || req.cookies.vypax_token)) {
    token = req.cookies.vyaapx_token || req.cookies.vypax_token;
  }

  if (!token) {
    // Graceful demo fallback: provide primary demo user Aarav Mehta if no token provided
    // This allows first-time visitors to immediately explore the platform seamlessly
    const demoUser = db.users.get('user-aarav-001');
    if (demoUser) {
      req.user = demoUser;
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = db.users.get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        error: 'Account suspended.',
        reason: user.suspensionReason || 'Contact platform compliance administrator.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && (req.cookies.vyaapx_token || req.cookies.vypax_token)) {
    token = req.cookies.vyaapx_token || req.cookies.vypax_token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      const user = db.users.get(decoded.userId);
      if (user && !user.isSuspended && user.isActive) {
        req.user = user;
        req.token = token;
      }
    } catch {
      // Ignore token failure in optional mode
    }
  }

  if (!req.user) {
    req.user = db.users.get('user-aarav-001');
  }

  next();
};
