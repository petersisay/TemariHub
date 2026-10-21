import { Router } from 'express';
import { SourceController } from './source.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { csrfProtection } from '../../middleware/csrf.middleware.js';

const router = Router();

// Public / Authenticated read list of approved sources
router.get('/', SourceController.list);

// Admin-only endpoints
router.post(
  '/',
  requireAuth,
  requireRole(['admin']),
  csrfProtection,
  SourceController.create
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(['admin']),
  csrfProtection,
  SourceController.update
);

router.post(
  '/:id/check',
  requireAuth,
  requireRole(['admin']),
  csrfProtection,
  SourceController.checkSingle
);

router.post(
  '/check-all',
  requireAuth,
  requireRole(['admin']),
  csrfProtection,
  SourceController.checkAll
);

router.get(
  '/health/stats',
  requireAuth,
  requireRole(['admin']),
  SourceController.getHealth
);

export const sourceRoutes = router;
