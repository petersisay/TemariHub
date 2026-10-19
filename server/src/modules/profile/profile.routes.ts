import { Router } from 'express';
import { profileController } from './profile.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema } from './profile.validation.js';

const router = Router();

// Minimal protected profile endpoints for Phase 2 verification
router.get('/me', requireAuth, profileController.getMe);
router.put('/me', requireAuth, validate(updateProfileSchema), profileController.updateMe);
router.get('/:userId', requireAuth, profileController.getProfileById);

export default router;
