import { Router } from 'express';
import { profileController } from './profile.controller.js';
import { avatarController } from './avatar.controller.js';
import { avatarUploadMiddleware } from '../../middleware/upload.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema, updatePreferencesSchema } from './profile.validation.js';

const router = Router();

// Minimal protected profile endpoints for Phase 2 verification
router.get('/me', requireAuth, profileController.getMe);
router.put('/me', requireAuth, validate(updateProfileSchema), profileController.updateMe);
router.put('/preferences', requireAuth, validate(updatePreferencesSchema), profileController.updatePreferences);
router.get('/:userId', requireAuth, profileController.getProfileById);

// Profile Picture & Avatar Management endpoints (All Authenticated User Roles)
router.post('/avatar', requireAuth, avatarUploadMiddleware.single('avatar'), avatarController.uploadAvatar);
router.delete('/avatar', requireAuth, avatarController.removeAvatar);
router.get('/avatar', requireAuth, avatarController.getAvatar);

export default router;
