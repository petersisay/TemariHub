import { describe, it, expect } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { csrfProtection } from '../src/middleware/csrf.middleware.js';
import { errorHandler } from '../src/middleware/error.middleware.js';
import { env } from '../src/config/env.js';

describe('CSRF Protection & Origin Header Tests', () => {
  function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use(csrfProtection);

    app.get('/test-endpoint', (_req: Request, res: Response) => {
      res.status(200).json({ success: true, method: 'GET' });
    });

    app.post('/test-endpoint', (_req: Request, res: Response) => {
      res.status(200).json({ success: true, method: 'POST' });
    });

    app.put('/test-endpoint', (_req: Request, res: Response) => {
      res.status(200).json({ success: true, method: 'PUT' });
    });

    app.delete('/test-endpoint', (_req: Request, res: Response) => {
      res.status(200).json({ success: true, method: 'DELETE' });
    });

    app.use(errorHandler);
    return app;
  }

  const app = createTestApp();

  describe('1. Safe HTTP Methods', () => {
    it('allows GET requests without any custom headers or Origin', async () => {
      const res = await request(app).get('/test-endpoint');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('allows HEAD requests without custom headers', async () => {
      const res = await request(app).head('/test-endpoint');
      expect(res.status).toBe(200);
    });
  });

  describe('2. Custom Header Defense-in-Depth', () => {
    it('blocks mutating POST request when X-Requested-With is absent', async () => {
      const res = await request(app)
        .post('/test-endpoint')
        .send({ data: 'sample' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cross-site request forgery');
      expect(res.body.message).toContain('custom header verification');
    });

    it('blocks mutating PUT request when X-Requested-With has wrong value', async () => {
      const res = await request(app)
        .put('/test-endpoint')
        .set('X-Requested-With', 'InvalidValue')
        .send({ data: 'sample' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows mutating POST request when X-Requested-With is XMLHttpRequest', async () => {
      const res = await request(app)
        .post('/test-endpoint')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ data: 'sample' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Production Origin Header Verification', () => {
    const originalEnvNodeEnv = env.NODE_ENV;
    const clientOrigin = new URL(env.CLIENT_URL).origin;

    afterEach(() => {
      (env as any).NODE_ENV = originalEnvNodeEnv;
    });

    it('allows mutating request in production when Origin exactly matches CLIENT_URL', async () => {
      (env as any).NODE_ENV = 'production';

      const res = await request(app)
        .post('/test-endpoint')
        .set('Origin', clientOrigin)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ data: 'sample' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects mutating request in production when Origin does NOT match CLIENT_URL', async () => {
      (env as any).NODE_ENV = 'production';

      const res = await request(app)
        .post('/test-endpoint')
        .set('Origin', 'https://malicious-attacker-site.com')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ data: 'sample' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid request origin');
    });

    it('rejects mutating request in production with spoofed subdomain origin', async () => {
      (env as any).NODE_ENV = 'production';

      const spoofedOrigin = `https://spoofed.${new URL(env.CLIENT_URL).hostname}`;
      const res = await request(app)
        .post('/test-endpoint')
        .set('Origin', spoofedOrigin)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ data: 'sample' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid request origin');
    });

    it('rejects mutating request in production when matching Origin is provided but X-Requested-With is missing', async () => {
      (env as any).NODE_ENV = 'production';

      const res = await request(app)
        .post('/test-endpoint')
        .set('Origin', clientOrigin)
        .send({ data: 'sample' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('custom header verification');
    });
  });
});
