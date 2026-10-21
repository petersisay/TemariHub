import { Router, Request, Response, NextFunction } from 'express';
import { OpportunityController } from './opportunity.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { csrfProtection } from '../../middleware/csrf.middleware.js';
import { User } from '../../models/User.js';

const router = Router();

// Middleware to populate req.user if session exists, without blocking unauthenticated requests
async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (req.session?.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignore error for optional authentication
    }
  }
  next();
}

// Public opportunity listing
router.get('/', OpportunityController.list);

// Authenticated user's own submissions (must precede parameterized :idOrSlug route)
router.get(
  '/my-submissions',
  requireAuth,
  requireRole(['submitter', 'admin']),
  OpportunityController.getMySubmissions
);

// Get single opportunity by ID or slug (public if published, owner/admin if draft)
router.get('/:idOrSlug', optionalAuth, OpportunityController.getByIdOrSlug);

// Submitter & Admin opportunity creation
router.post(
  '/submit',
  requireAuth,
  csrfProtection,
  requireRole(['submitter', 'admin']),
  OpportunityController.submit
);

router.post(
  '/',
  requireAuth,
  csrfProtection,
  requireRole(['submitter', 'admin']),
  OpportunityController.submit
);

// Submitter & Admin opportunity editing
router.put(
  '/:id',
  requireAuth,
  csrfProtection,
  requireRole(['submitter', 'admin']),
  OpportunityController.updateMySubmission
);

router.patch(
  '/:id',
  requireAuth,
  csrfProtection,
  requireRole(['submitter', 'admin']),
  OpportunityController.updateMySubmission
);

// Report opportunity
router.post(
  '/:id/report',
  requireAuth,
  csrfProtection,
  OpportunityController.report
);

export const opportunityRoutes = router;
