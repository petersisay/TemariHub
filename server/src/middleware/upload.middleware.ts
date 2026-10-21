import multer from 'multer';
import { BadRequestError } from '../utils/errors.js';

// Use memory storage for server-side image stream processing and Sharp validation
const memoryStorage = multer.memoryStorage();

export const avatarUploadMiddleware = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum upload size
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
      return cb(new BadRequestError('Unsupported file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
    cb(null, true);
  },
});
