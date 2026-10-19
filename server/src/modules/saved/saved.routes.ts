import { Router } from 'express';
import { SavedController } from './saved.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { csrfProtection } from '../../middleware/csrf.middleware.js';

const router = Router();

// Saved opportunities is a student feature
router.use(requireAuth);
router.use(requireRole(['student', 'admin']));

router.get('/', SavedController.list);
router.get('/:opportunityId/status', SavedController.checkIsSaved);
router.post('/:opportunityId', csrfProtection, SavedController.save);
router.delete('/:opportunityId', csrfProtection, SavedController.unsave);

export const savedRoutes = router;
