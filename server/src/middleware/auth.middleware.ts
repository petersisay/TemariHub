import { Request, Response, NextFunction } from 'express';
import { User, IUser, UserRole } from '../models/User.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    userRole: UserRole;
    userName: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const sessionUserId = req.session?.userId;

  if (!sessionUserId) {
    return next(new UnauthorizedError('Authentication required. Please sign in.'));
  }

  try {
    const user = await User.findById(sessionUserId);

    if (!user) {
      // Session exists but user was deleted
      req.session.destroy(() => {});
      return next(new UnauthorizedError('User account associated with this session no longer exists.'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Role '${req.user.role}' is not authorized to perform this operation.`
        )
      );
    }

    next();
  };
}

export function checkOwnership(
  resourceOwnerId: string | { toString: () => string },
  currentUser: IUser
): boolean {
  if (currentUser.role === 'admin') {
    return true; // Administrators possess systemic override
  }
  return resourceOwnerId.toString() === currentUser._id.toString();
}
