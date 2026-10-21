import { Request, Response, NextFunction } from 'express';
import { avatarService } from './avatar.service.js';
import { BadRequestError } from '../../utils/errors.js';

export class AvatarController {
  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file || !req.file.buffer) {
        throw new BadRequestError('No image file was uploaded. Please select a JPEG, PNG, or WebP photo.');
      }

      // User ID is strictly obtained from the authenticated session
      const userId = req.user!._id.toString();
      const updatedUser = await avatarService.uploadAvatar(userId, req.file.buffer);

      res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully.',
        data: {
          user: updatedUser,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async removeAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const updatedUser = await avatarService.removeAvatar(userId);

      res.status(200).json({
        success: true,
        message: 'Custom profile picture removed successfully.',
        data: {
          user: updatedUser,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const avatarInfo = await avatarService.getAvatarInfo(userId);

      res.status(200).json({
        success: true,
        data: avatarInfo,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const avatarController = new AvatarController();
