import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/utils/password.js';

describe('Profile & Authorization Integration Tests', () => {
  const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' };

  it('denies unauthenticated requests to protected profile routes (401)', async () => {
    const res = await request(app).get('/api/v1/profile/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Authentication required');
  });

  it('allows authenticated student to view and update their own profile', async () => {
    // 1. Register student
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .set(CSRF_HEADER)
      .send({
        fullName: 'Selamawit Desta',
        email: 'selam@astu.edu.et',
        password: 'Password123!',
        role: 'student',
      });

    // 2. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({
        email: 'selam@astu.edu.et',
        password: 'Password123!',
      });

    const cookie = (loginRes.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.includes('temarihub_sid')
    );

    // 3. View profile
    const getRes = await request(app)
      .get('/api/v1/profile/me')
      .set('Cookie', cookie!);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.profile.university).toBe('ASTU (Adama Science and Technology University)');

    // 4. Update profile
    const updateRes = await request(app)
      .put('/api/v1/profile/me')
      .set(CSRF_HEADER)
      .set('Cookie', cookie!)
      .send({
        fieldOfStudy: 'Computer Science and Engineering',
        skills: ['TypeScript', 'Node.js', 'React', 'MongoDB'],
        bio: 'Aspiring software engineer from ASTU.',
        graduationYear: 2026,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.profile.fieldOfStudy).toBe('Computer Science and Engineering');
    expect(updateRes.body.data.profile.skills).toContain('TypeScript');
    expect(updateRes.body.data.profile.skills).toContain('React');
  });

  it('enforces cross-user resource access denial: Student A cannot view Student B profile (403)', async () => {
    // Register Student A
    const regA = await request(app)
      .post('/api/v1/auth/register')
      .set(CSRF_HEADER)
      .send({
        fullName: 'Student A',
        email: 'student.a@astu.edu.et',
        password: 'Password123!',
      });
    const studentAId = regA.body.data.user._id;

    // Register Student B
    const regB = await request(app)
      .post('/api/v1/auth/register')
      .set(CSRF_HEADER)
      .send({
        fullName: 'Student B',
        email: 'student.b@astu.edu.et',
        password: 'Password123!',
      });
    const studentBId = regB.body.data.user._id;

    // Login as Student A
    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({
        email: 'student.a@astu.edu.et',
        password: 'Password123!',
      });
    const cookieA = (loginA.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.includes('temarihub_sid')
    );

    // Student A attempts to access Student B's profile
    const forbiddenRes = await request(app)
      .get(`/api/v1/profile/${studentBId}`)
      .set('Cookie', cookieA!);

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.success).toBe(false);
    expect(forbiddenRes.body.message).toContain('Access denied');
  });

  it('allows administrator to view any student profile', async () => {
    // Create Student Target
    const regStudent = await request(app)
      .post('/api/v1/auth/register')
      .set(CSRF_HEADER)
      .send({
        fullName: 'Target Student',
        email: 'target.student@astu.edu.et',
        password: 'Password123!',
      });
    const studentId = regStudent.body.data.user._id;

    // Create Admin directly in database (simulating secure admin provisioning)
    const adminPasswordHash = await hashPassword('AdminPass123!');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@temarihub.et',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isVerified: true,
    });

    // Login as Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({
        email: 'admin@temarihub.et',
        password: 'AdminPass123!',
      });

    const adminCookie = (adminLogin.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.includes('temarihub_sid')
    );

    // Admin views target student profile
    const adminAccessRes = await request(app)
      .get(`/api/v1/profile/${studentId}`)
      .set('Cookie', adminCookie!);

    expect(adminAccessRes.status).toBe(200);
    expect(adminAccessRes.body.success).toBe(true);
    expect(adminAccessRes.body.data.profile.userId).toBe(studentId);
  });
});
