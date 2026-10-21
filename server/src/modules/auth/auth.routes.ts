import { Router } from 'express';
import { authController } from './auth.controller.js';
import { registerSchema, loginSchema, googleAuthSchema } from './auth.validation.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { csrfProtection } from '../../middleware/csrf.middleware.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post(
  '/google',
  authLimiter,
  csrfProtection,
  validate({ body: googleAuthSchema }),
  authController.googleAuth
);

router.post(
  '/register',
  authLimiter,
  csrfProtection,
  validate({ body: registerSchema }),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  csrfProtection,
  validate({ body: loginSchema }),
  authController.login
);

router.post(
  '/logout',
  csrfProtection,
  requireAuth,
  authController.logout
);

router.get('/me', requireAuth, authController.getMe);

export const authRoutes = router;
