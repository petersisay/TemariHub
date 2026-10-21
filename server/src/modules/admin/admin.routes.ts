import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { csrfProtection } from '../../middleware/csrf.middleware.js';

const router = Router();

// Strict security: All admin endpoints require authenticated administrator role
router.use(requireAuth);
router.use(requireRole('admin'));

// Moderation queue
router.get('/moderation/queue', AdminController.getQueue);
router.get('/opportunities', AdminController.getQueue); // Alias
router.put('/moderation/:id/decision', csrfProtection, AdminController.decideModeration);
router.patch('/opportunities/:id/moderation', csrfProtection, AdminController.decideModeration); // Alias

// Verification workflow & continuous updates
router.get('/opportunities/verification-queue', AdminController.getVerificationQueue);
router.post('/opportunities/:id/verify', csrfProtection, AdminController.decideVerification);
router.patch('/opportunities/:id/verify', csrfProtection, AdminController.decideVerification);
router.get('/opportunities/change-history', AdminController.getChangeHistory);

// User reports
router.get('/reports', AdminController.getReports);
router.put('/reports/:id/resolve', csrfProtection, AdminController.resolveReport);
router.patch('/reports/:id', csrfProtection, AdminController.resolveReport); // Alias

// Audit logs & metrics
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/stats', AdminController.getStats);

export const adminRoutes = router;
