import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { StudentProfile } from '../src/models/StudentProfile.js';

describe('Auth & Health Integration Tests', () => {
  const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' };

  describe('1. Health Check Endpoint', () => {
    it('GET /api/v1/health returns 200 and healthy status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
      expect(res.body.uptime).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('2. User Registration', () => {
    it('registers a new student and creates a default student profile', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Abebe Bikila',
          email: 'abebe@astu.edu.et',
          password: 'SecurePassword123!',
          role: 'student',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('abebe@astu.edu.et');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Verify user in database
      const dbUser = await User.findOne({ email: 'abebe@astu.edu.et' }).select('+passwordHash');
      expect(dbUser).toBeDefined();
      expect(dbUser?.passwordHash).toBeDefined();
      expect(dbUser?.passwordHash).not.toBe('SecurePassword123!'); // Must be hashed

      // Verify default StudentProfile creation
      const profile = await StudentProfile.findOne({ userId: dbUser?._id });
      expect(profile).toBeDefined();
    });

    it('registers a submitter successfully without a student profile', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Tech Org Recruiter',
          email: 'recruiter@ethiopiatech.com',
          password: 'RecruiterPassword123!',
          role: 'submitter',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('submitter');

      const profile = await StudentProfile.findOne({ userId: res.body.data.user._id });
      expect(profile).toBeNull();
    });

    it('denies public administrator registration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Malicious Attacker',
          email: 'hacker@example.com',
          password: 'HackerPassword123!',
          role: 'admin',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      const dbUser = await User.findOne({ email: 'hacker@example.com' });
      expect(dbUser).toBeNull();
    });

    it('rejects malformed registration requests', async () => {
      // Missing password
      const res1 = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Incomplete User',
          email: 'incomplete@example.com',
        });
      expect(res1.status).toBe(400);

      // Short password (< 8 chars)
      const res2 = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Short Pass',
          email: 'shortpass@example.com',
          password: '123',
        });
      expect(res2.status).toBe(400);

      // Invalid email
      const res3 = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Bad Email',
          email: 'not-an-email',
          password: 'ValidPassword123!',
        });
      expect(res3.status).toBe(400);
    });

    it('prevents duplicate registration with 409 Conflict', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Existing User',
          email: 'duplicate@astu.edu.et',
          password: 'SecurePassword123!',
        });

      const duplicateRes = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Existing User Again',
          email: 'duplicate@astu.edu.et',
          password: 'AnotherPassword123!',
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
    });
  });

  describe('3. Login, Sessions, and Current User', () => {
    it('authenticates with valid credentials and establishes a session cookie', async () => {
      // Register first
      await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Tigist Assefa',
          email: 'tigist@astu.edu.et',
          password: 'MyPassword123!',
        });

      // Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set(CSRF_HEADER)
        .send({
          email: 'tigist@astu.edu.et',
          password: 'MyPassword123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.user.email).toBe('tigist@astu.edu.et');
      expect(loginRes.body.data.user.passwordHash).toBeUndefined();

      // Check cookie
      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
      const sessionCookie = (cookies as unknown as string[]).find((c) => c.includes('temarihub_sid'));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain('HttpOnly');

      // Check session persistence on GET /api/v1/auth/me
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', sessionCookie!);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.email).toBe('tigist@astu.edu.et');
    });

    it('rejects invalid credentials with generic error', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Sample Student',
          email: 'student@example.com',
          password: 'ValidPassword123!',
        });

      // Wrong password
      const wrongPassRes = await request(app)
        .post('/api/v1/auth/login')
        .set(CSRF_HEADER)
        .send({
          email: 'student@example.com',
          password: 'WrongPassword!',
        });

      expect(wrongPassRes.status).toBe(401);
      expect(wrongPassRes.body.success).toBe(false);
      expect(wrongPassRes.body.message).toBe('Invalid email or password.');

      // Non-existent email
      const wrongEmailRes = await request(app)
        .post('/api/v1/auth/login')
        .set(CSRF_HEADER)
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!',
        });

      expect(wrongEmailRes.status).toBe(401);
      expect(wrongEmailRes.body.success).toBe(false);
      expect(wrongEmailRes.body.message).toBe('Invalid email or password.');
    });

    it('invalidates session on logout', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Logout User',
          email: 'logout@example.com',
          password: 'Password123!',
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set(CSRF_HEADER)
        .send({
          email: 'logout@example.com',
          password: 'Password123!',
        });

      const sessionCookie = (loginRes.headers['set-cookie'] as unknown as string[])?.find((c) =>
        c.includes('temarihub_sid')
      );

      // Verify authenticated before logout
      const beforeLogout = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', sessionCookie!);
      expect(beforeLogout.status).toBe(200);

      // Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set(CSRF_HEADER)
        .set('Cookie', sessionCookie!);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Subsequent access must be unauthorized (401)
      const afterLogout = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', sessionCookie!);
      expect(afterLogout.status).toBe(401);
    });
  });

  describe('4. CSRF Protection', () => {
    it('blocks mutating requests that lack X-Requested-With header', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'any@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cross-site request forgery');
    });

    it('permits safe GET requests without CSRF custom header', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
    });
  });
});
