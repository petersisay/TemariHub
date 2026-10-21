import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp, { type Metadata } from 'sharp';
import { User, IUser } from '../../models/User.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export function getAvatarsStorageDir(): string {
  // Resolve base uploads directory deterministically whether running from root workspace or server subdirectory
  const cwd = process.cwd();
  let baseUploadsDir = path.resolve(cwd, 'uploads');
  if (fs.existsSync(path.resolve(cwd, 'server'))) {
    baseUploadsDir = path.resolve(cwd, 'server', 'uploads');
  }

  const avatarsDir = path.resolve(baseUploadsDir, 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  return avatarsDir;
}

export class AvatarService {
  /**
   * Validates, processes, and persists a custom profile avatar for an authenticated user.
   * Resizes and crops to a standard 512x512 WebP image.
   */
  async uploadAvatar(userId: string, imageBuffer: Buffer): Promise<IUser> {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new BadRequestError('No image data provided for upload.');
    }

    if (imageBuffer.length > 5 * 1024 * 1024) {
      throw new BadRequestError('Image file exceeds the 5 MB maximum size limit.');
    }

    // Server-side image content inspection & format validation using Sharp
    let metadata: Metadata;
    try {
      metadata = await sharp(imageBuffer).metadata();
    } catch {
      throw new BadRequestError('Corrupted or invalid image file. Please upload a genuine photo.');
    }

    const allowedFormats = ['jpeg', 'png', 'webp'];
    if (!metadata.format || !allowedFormats.includes(metadata.format.toLowerCase())) {
      throw new BadRequestError(
        `Unsupported image format (${metadata.format || 'unknown'}). Only JPEG, PNG, and WebP images are permitted.`
      );
    }

    // Limit maximum dimensions to prevent decompression bombs
    if ((metadata.width && metadata.width > 5000) || (metadata.height && metadata.height > 5000)) {
      throw new BadRequestError('Image dimensions too large. Maximum dimensions allowed are 5000x5000 pixels.');
    }

    // Crop and resize to 512x512 square avatar, optimized as WebP
    const processedBuffer = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toBuffer();

    const avatarsDir = getAvatarsStorageDir();
    const safeFilename = `avatar-${userId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.webp`;
    const targetFilePath = path.join(avatarsDir, safeFilename);

    await fs.promises.writeFile(targetFilePath, processedBuffer);

    // Find and update user record
    const user = await User.findById(userId);
    if (!user) {
      // Clean up uploaded file if user not found
      await fs.promises.unlink(targetFilePath).catch(() => {});
      throw new NotFoundError('User account not found.');
    }

    // Safely delete previous custom avatar file if present
    if (user.customAvatarUrl && user.customAvatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = path.basename(user.customAvatarUrl);
      const oldFilePath = path.join(avatarsDir, oldFilename);
      if (fs.existsSync(oldFilePath)) {
        await fs.promises.unlink(oldFilePath).catch((err) => {
          console.warn('Failed to delete obsolete avatar file:', err);
        });
      }
    }

    const publicAvatarUrl = `/uploads/avatars/${safeFilename}`;
    user.hasCustomAvatar = true;
    user.customAvatarUrl = publicAvatarUrl;
    user.avatarUrl = publicAvatarUrl;

    await user.save();
    return user;
  }

  /**
   * Removes a user's custom profile avatar and reverts to Google or default avatar.
   */
  async removeAvatar(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found.');
    }

    const avatarsDir = getAvatarsStorageDir();

    // Clean up physical file
    if (user.customAvatarUrl && user.customAvatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = path.basename(user.customAvatarUrl);
      const oldFilePath = path.join(avatarsDir, oldFilename);
      if (fs.existsSync(oldFilePath)) {
        await fs.promises.unlink(oldFilePath).catch((err) => {
          console.warn('Failed to delete removed avatar file:', err);
        });
      }
    }

    user.hasCustomAvatar = false;
    user.customAvatarUrl = '';
    user.set('customAvatarUrl', undefined);
    // Revert to Google avatar if one was provided, otherwise empty
    user.avatarUrl = user.googleAvatarUrl || '';

    await user.save();
    return user;
  }

  /**
   * Returns avatar details for a user.
   */
  async getAvatarInfo(userId: string): Promise<{
    avatarUrl?: string;
    customAvatarUrl?: string;
    googleAvatarUrl?: string;
    hasCustomAvatar: boolean;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found.');
    }

    return {
      avatarUrl: user.avatarUrl,
      customAvatarUrl: user.customAvatarUrl,
      googleAvatarUrl: user.googleAvatarUrl,
      hasCustomAvatar: Boolean(user.hasCustomAvatar),
    };
  }
}

export const avatarService = new AvatarService();
