import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { verifyGoogleToken, authenticateWithGooglePayload } from './googleAuth.service.js';
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

  async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body;
      const verifiedPayload = await verifyGoogleToken(idToken);
      const { user, isNewUser } = await authenticateWithGooglePayload(verifiedPayload, req.ip);

      req.session.regenerate((err) => {
        if (err) return next(err);

        req.session.userId = user._id.toString();
        req.session.userRole = user.role;
        req.session.userName = user.name;

        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);

          res.status(isNewUser ? 201 : 200).json({
            success: true,
            message: isNewUser
              ? 'Google account registered successfully.'
              : 'Google sign-in successful.',
            data: {
              user,
              isNewUser,
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
          sameSite: env.SESSION_COOKIE_SAME_SITE || (env.NODE_ENV === 'production' ? 'none' : 'lax'),
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
