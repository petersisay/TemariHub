import { Router } from 'express';
import { TrackerController } from './tracker.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { csrfProtection } from '../../middleware/csrf.middleware.js';

const router = Router();

// All tracker operations require student (or admin) authentication
router.use(requireAuth);
router.use(requireRole(['student', 'admin']));

router.get('/', TrackerController.list);
router.get('/stats', TrackerController.stats);
router.post('/', csrfProtection, TrackerController.add);
router.put('/:trackerId', csrfProtection, TrackerController.update);
router.patch('/:trackerId', csrfProtection, TrackerController.update);
router.delete('/:trackerId', csrfProtection, TrackerController.delete);

export const trackerRoutes = router;
