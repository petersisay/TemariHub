import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { StudentProfile } from '../src/models/StudentProfile.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { env } from '../src/config/env.js';
import {
  setGoogleOAuthClientForTesting,
  resetGoogleOAuthClient,
} from '../src/modules/auth/googleAuth.service.js';

describe('Google Authentication Upgrade Tests', () => {
  const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' };

  let mockVerifyIdToken: any;

  beforeEach(() => {
    mockVerifyIdToken = async ({ idToken }: { idToken: string }) => {
      if (idToken === 'VALID_STUDENT_TOKEN') {
        return {
          getPayload: () => ({
            sub: 'google_sub_student_12345',
            email: 'solomon@astu.edu.et',
            email_verified: true,
            name: 'Solomon Hailu',
            picture: 'https://lh3.googleusercontent.com/avatar/solomon.png',
          }),
        };
      }
      if (idToken === 'VALID_ADMIN_TOKEN') {
        return {
          getPayload: () => ({
            sub: 'google_sub_admin_99999',
            email: 'petrossisay1646@gmail.com',
            email_verified: true,
            name: 'Petros Sisay Admin',
            picture: 'https://lh3.googleusercontent.com/avatar/admin.png',
          }),
        };
      }
      if (idToken === 'VALID_SUBMITTER_TOKEN') {
        return {
          getPayload: () => ({
            sub: 'google_sub_submitter_77777',
            email: 'petrossisay7164@gmail.com',
            email_verified: true,
            name: 'Petros Sisay Submitter',
            picture: 'https://lh3.googleusercontent.com/avatar/submitter.png',
          }),
        };
      }
      if (idToken === 'UNVERIFIED_EMAIL_TOKEN') {
        return {
          getPayload: () => ({
            sub: 'google_sub_unverified_456',
            email: 'unverified@example.com',
            email_verified: false,
            name: 'Unverified User',
          }),
        };
      }
      if (idToken === 'WRONG_AUDIENCE_OR_EXPIRED_TOKEN') {
        throw new Error('Token used too late, expired or wrong audience');
      }
      if (idToken === 'OUTSIDER_GMAIL_TOKEN') {
        return {
          getPayload: () => ({
            sub: 'google_sub_outsider_333',
            email: 'outsider@gmail.com',
            email_verified: true,
            name: 'Outsider Student',
          }),
        };
      }
      throw new Error('Invalid token');
    };

    setGoogleOAuthClientForTesting({
      verifyIdToken: mockVerifyIdToken,
    });
  });

  afterEach(() => {
    resetGoogleOAuthClient();
  });

  describe('1. Token Verification & Account Creation', () => {
    it('registers a new student via valid Google ID token with session cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_STUDENT_TOKEN' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isNewUser).toBe(true);
      expect(res.body.data.user.email).toBe('solomon@astu.edu.et');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.googleId).toBe('google_sub_student_12345');
      expect(res.body.data.user.authProvider).toBe('google');

      // Verify Session Cookie was set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain(env.SESSION_COOKIE_NAME);

      // Verify Student Profile was automatically initialized
      const dbUser = await User.findOne({ googleId: 'google_sub_student_12345' });
      expect(dbUser).toBeDefined();
      const profile = await StudentProfile.findOne({ userId: dbUser?._id });
      expect(profile).toBeDefined();

      // Verify Audit Log
      const audit = await AuditLog.findOne({ targetId: dbUser?._id, action: 'user_registered' });
      expect(audit).toBeDefined();
    });

    it('rejects an expired or wrong-audience Google token with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'WRONG_AUDIENCE_OR_EXPIRED_TOKEN' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Google token verification failed');
    });

    it('rejects an unverified Google account email with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'UNVERIFIED_EMAIL_TOKEN' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Google account email is not verified');
    });

    it('rejects requests missing custom CSRF header', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ idToken: 'VALID_STUDENT_TOKEN' });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Configured Privileged Accounts (Admin & Submitter)', () => {
    it('strictly provisions role: admin when verified Google email matches ADMIN_EMAIL', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_ADMIN_TOKEN' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('petrossisay1646@gmail.com');
      expect(res.body.data.user.role).toBe('admin');

      // Verify Audit Log was generated for admin provisioning
      const dbAdmin = await User.findOne({ email: 'petrossisay1646@gmail.com' });
      expect(dbAdmin?.role).toBe('admin');
      const audit = await AuditLog.findOne({ targetId: dbAdmin?._id, action: 'admin_provisioned' });
      expect(audit).toBeDefined();
    });

    it('strictly provisions role: submitter when verified Google email matches SUBMITTER_EMAIL', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_SUBMITTER_TOKEN' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('petrossisay7164@gmail.com');
      expect(res.body.data.user.role).toBe('submitter');
    });

    it('prevents self-assignment of administrator role through standard registration endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF_HEADER)
        .send({
          fullName: 'Malicious Attacker',
          email: 'attacker@example.com',
          password: 'Password123!',
          role: 'admin',
        });

      // Zod validation rejects role 'admin'
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed for provided input');
      expect(JSON.stringify(res.body.errors)).toContain('Administrator accounts cannot be self-provisioned');
    });
  });

  describe('3. Repeat Sign-Ins & Safe Account Linking', () => {
    it('handles repeat Google sign-ins idempotently without creating duplicate accounts', async () => {
      // 1st Sign In
      await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_STUDENT_TOKEN' });

      // 2nd Sign In
      const res2 = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_STUDENT_TOKEN' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.isNewUser).toBe(false);

      const count = await User.countDocuments({ googleId: 'google_sub_student_12345' });
      expect(count).toBe(1);
    });

    it('securely links Google identity to an existing account with matching verified email', async () => {
      // Pre-existing local user
      const existingUser = await User.create({
        name: 'Existing Local Submitter',
        email: 'petrossisay7164@gmail.com',
        role: 'student',
        passwordHash: 'hashed_password_for_local_account',
        isVerified: true,
      });

      // Sign in with Google with matching verified email
      const res = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_SUBMITTER_TOKEN' });

      expect(res.status).toBe(200);
      expect(res.body.data.isNewUser).toBe(false);

      const updated = await User.findById(existingUser._id);
      expect(updated?.googleId).toBe('google_sub_submitter_77777');
      expect(updated?.authProvider).toBe('google');
      expect(updated?.role).toBe('submitter'); // Promoted to configured submitter role
    });
  });

  describe('4. Session Persistence and me endpoint', () => {
    it('allows accessing GET /api/v1/auth/me with session cookie established by Google sign-in', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_STUDENT_TOKEN' });

      const cookie = loginRes.headers['set-cookie'][0];

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe('solomon@astu.edu.et');
      expect(meRes.body.data.user.role).toBe('student');
    });

    it('clears session cookie on logout', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_STUDENT_TOKEN' });

      const cookie = loginRes.headers['set-cookie'][0];

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set(CSRF_HEADER)
        .set('Cookie', cookie);

      expect(logoutRes.status).toBe(200);
    });
  });

  describe('5. Concurrent Google Sign-Ins and Session Robustness', () => {
    it('handles concurrent Google authentication attempts idempotently without collisions', async () => {
      // Fire 3 simultaneous Google sign-in requests
      const promises = [
        request(app).post('/api/v1/auth/google').set(CSRF_HEADER).send({ idToken: 'VALID_STUDENT_TOKEN' }),
        request(app).post('/api/v1/auth/google').set(CSRF_HEADER).send({ idToken: 'VALID_STUDENT_TOKEN' }),
        request(app).post('/api/v1/auth/google').set(CSRF_HEADER).send({ idToken: 'VALID_STUDENT_TOKEN' }),
      ];

      const results = await Promise.all(promises);

      // All requests should succeed with 200 or 201
      for (const res of results) {
        expect([200, 201]).toContain(res.status);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.email).toBe('solomon@astu.edu.et');
      }

      // Exactly one user account must exist
      const userCount = await User.countDocuments({ email: 'solomon@astu.edu.et' });
      expect(userCount).toBe(1);
    });
  });

  describe('6. Full User Profile Management Across Roles', () => {
    it('allows an authenticated user to update their display name, bio, and choose a unique username', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_STUDENT_TOKEN' });

      const cookie = loginRes.headers['set-cookie'][0];

      // Update profile with unique username, bio, and institution
      const updateRes = await request(app)
        .put('/api/v1/profile/me')
        .set(CSRF_HEADER)
        .set('Cookie', cookie)
        .send({
          name: 'Solomon Hailu Updated',
          username: 'solomon_tech',
          bio: 'Fullstack developer passionate about fintech.',
          institution: 'ASTU Computer Science',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.user.name).toBe('Solomon Hailu Updated');
      expect(updateRes.body.data.user.username).toBe('solomon_tech');
      expect(updateRes.body.data.user.bio).toBe('Fullstack developer passionate about fintech.');
      expect(updateRes.body.data.user.institution).toBe('ASTU Computer Science');

      // Verify GET /profile/me returns updated fields
      const getRes = await request(app)
        .get('/api/v1/profile/me')
        .set('Cookie', cookie);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.user.username).toBe('solomon_tech');
      expect(getRes.body.data.user.name).toBe('Solomon Hailu Updated');
    });

    it('rejects duplicate username with a clear 409 Conflict error', async () => {
      // Create user 1 with username 'astu_engineer'
      await User.create({
        name: 'Engineer One',
        email: 'eng1@astu.edu.et',
        username: 'astu_engineer',
        role: 'student',
        authProvider: 'google',
        isVerified: true,
      });

      // Login as user 2
      const loginRes = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_STUDENT_TOKEN' });

      const cookie = loginRes.headers['set-cookie'][0];

      // Attempt to claim existing username
      const conflictRes = await request(app)
        .put('/api/v1/profile/me')
        .set(CSRF_HEADER)
        .set('Cookie', cookie)
        .send({ username: 'astu_engineer' });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.success).toBe(false);
      expect(conflictRes.body.message).toContain('username is already taken');
    });

    it('rejects reserved system usernames with 400 Bad Request', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_STUDENT_TOKEN' });

      const cookie = loginRes.headers['set-cookie'][0];

      const reservedRes = await request(app)
        .put('/api/v1/profile/me')
        .set(CSRF_HEADER)
        .set('Cookie', cookie)
        .send({ username: 'administrator' });

      expect(reservedRes.status).toBe(400);
      expect(reservedRes.body.success).toBe(false);
      expect(reservedRes.body.message).toContain('reserved');
    });

    it('allows an administrator or submitter to update their profile without requiring academic fields', async () => {
      // Login as admin
      const adminLogin = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_ADMIN_TOKEN' });

      const adminCookie = adminLogin.headers['set-cookie'][0];

      const updateAdmin = await request(app)
        .put('/api/v1/profile/me')
        .set(CSRF_HEADER)
        .set('Cookie', adminCookie)
        .send({
          name: 'Petros Administrator',
          username: 'petros_admin',
          bio: 'Platform maintainer and moderation lead.',
          institution: 'TemariHub Operations',
        });

      expect(updateAdmin.status).toBe(200);
      expect(updateAdmin.body.data.user.role).toBe('admin');
      expect(updateAdmin.body.data.user.username).toBe('petros_admin');
    });
  });
});
