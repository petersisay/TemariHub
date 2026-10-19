import { Request, Response, NextFunction } from 'express';
import { profileService } from './profile.service.js';

export class ProfileController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await profileService.getProfile(
        req.user!._id.toString(),
        req.user!
      );
      res.status(200).json({
        success: true,
        data: {
          profile,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await profileService.updateProfile(
        req.user!._id.toString(),
        req.body,
        req.user!
      );
      res.status(200).json({
        success: true,
        message: 'Student profile updated successfully.',
        data: {
          profile,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfileById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await profileService.getProfile(
        req.params.userId,
        req.user!
      );
      res.status(200).json({
        success: true,
        data: {
          profile,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const profileController = new ProfileController();
