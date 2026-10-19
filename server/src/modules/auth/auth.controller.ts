import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.register(req.body);

      // Session regeneration prevents session fixation attacks
      req.session.regenerate((err) => {
        if (err) return next(err);

        req.session.userId = user._id.toString();
        req.session.userRole = user.role;
        req.session.userName = user.name;

        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);

          res.status(201).json({
            success: true,
            message: 'Account registered successfully.',
            data: {
              user,
            },
          });
        });
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.login(req.body);

      req.session.regenerate((err) => {
        if (err) return next(err);

        req.session.userId = user._id.toString();
        req.session.userRole = user.role;
        req.session.userName = user.name;

        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);

          res.status(200).json({
            success: true,
            message: 'Sign-in successful.',
            data: {
              user,
            },
          });
        });
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cookieName = env.SESSION_COOKIE_NAME;

      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }

        res.clearCookie(cookieName, {
          path: '/',
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'lax',
        });

        res.status(200).json({
          success: true,
          message: 'Signed out successfully.',
        });
      });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
