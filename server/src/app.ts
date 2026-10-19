import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import { opportunityRoutes } from './modules/opportunities/opportunity.routes.js';
import { savedRoutes } from './modules/saved/saved.routes.js';
import { trackerRoutes } from './modules/tracker/tracker.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';

export function createApp(sessionStore?: session.Store): Express {
  const app = express();

  // Trust first proxy when in production or behind reverse proxy
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Security headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Request body parsing with strict size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Basic request logging
  if (env.NODE_ENV !== 'test') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
  }

  // Configure session store
  const store =
    sessionStore ||
    (env.NODE_ENV === 'test'
      ? new session.MemoryStore()
      : MongoStore.create({
          mongoUrl: env.MONGODB_URI,
          collectionName: 'sessions',
          ttl: Math.floor(env.SESSION_MAX_AGE_MS / 1000),
          touchAfter: 24 * 3600,
        }));

  // Session middleware
  app.use(
    session({
      name: env.SESSION_COOKIE_NAME,
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store,
      cookie: {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.SESSION_COOKIE_SAME_SITE || (env.NODE_ENV === 'production' ? 'none' : 'lax'),
        maxAge: env.SESSION_MAX_AGE_MS,
        path: '/',
      },
    })
  );

  // Health check endpoint
  app.get(`${env.API_PREFIX}/health`, (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: '1.0.0',
    });
  });

  // Apply general API rate limiter to all api routes
  app.use(env.API_PREFIX, apiLimiter);

  // Mount API modules
  app.use(`${env.API_PREFIX}/auth`, authRoutes);
  app.use(`${env.API_PREFIX}/profile`, profileRoutes);
  app.use(`${env.API_PREFIX}/students/profile`, profileRoutes); // Compatibility alias
  app.use(`${env.API_PREFIX}/opportunities`, opportunityRoutes);
  app.use(`${env.API_PREFIX}/saved-opportunities`, savedRoutes);
  app.use(`${env.API_PREFIX}/saved`, savedRoutes); // Compatibility alias
  app.use(`${env.API_PREFIX}/tracker`, trackerRoutes);
  app.use(`${env.API_PREFIX}/admin`, adminRoutes);

  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
