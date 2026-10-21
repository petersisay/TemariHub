import { Request, Response, NextFunction } from 'express';
import { profileService } from './profile.service.js';
import { User } from '../../models/User.js';

export class ProfileController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const complete = await profileService.getCompleteProfile(
        req.user!._id.toString(),
        req.user!
      );
      res.status(200).json({
        success: true,
        data: {
          user: complete.user,
          profile: complete.profile || complete.user,
          studentProfile: complete.studentProfile,
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
      const user = await User.findById(req.user!._id);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: {
          user,
          profile,
          studentProfile: user?.role === 'student' ? profile : null,
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

  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedUser = await profileService.updatePreferences(
        req.user!._id.toString(),
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Notification and language preferences saved successfully.',
        data: {
          user: updatedUser,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const profileController = new ProfileController();
