import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.js';
import { env } from '../config/env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Check custom header defense-in-depth:
  // Browsers forbid cross-origin forms from setting custom headers like X-Requested-With
  // without triggering a CORS preflight that will be rejected.
  const requestedWith = req.headers['x-requested-with'];
  const hasRequestedWith =
    typeof requestedWith === 'string' && requestedWith.toLowerCase() === 'xmlhttprequest';

  // Origin check if present
  const origin = req.headers['origin'] as string | undefined;
  if (origin && env.NODE_ENV === 'production') {
    const allowedOrigin = new URL(env.CLIENT_URL).origin;
    if (origin !== allowedOrigin) {
      return next(new ForbiddenError('Cross-site request forgery protection: Invalid request origin.'));
    }
  }

  if (!hasRequestedWith) {
    return next(
      new ForbiddenError(
        'Cross-site request forgery protection: Mutating requests require custom header verification.'
      )
    );
  }

  next();
}
