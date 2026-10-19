import { describe, it, expect, beforeEach } from 'vitest';
import { provisionAdmin } from '../src/scripts/seedAdmin.js';
import { User } from '../src/models/User.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { hashPassword, comparePassword } from '../src/utils/password.js';

describe('Administrator Provisioning (seedAdmin) Tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await AuditLog.deleteMany({});
  });

  describe('1. New Administrator Creation', () => {
    it('creates a new administrator with valid credentials, real name field, and audit entry', async () => {
      const email = 'superadmin@temarihub.et';
      const password = 'SuperSecurePassword2026!';
      const name = 'Abebe Admin';

      const result = await provisionAdmin({
        email,
        password,
        name,
        disconnectOnFinish: false,
      });

      expect(result.status).toBe('created');
      expect(result.email).toBe(email);
      expect(result.role).toBe('admin');
      expect(result.userId).toBeDefined();

      // Verify User record in DB
      const user = await User.findOne({ email }).select('+passwordHash');
      expect(user).toBeDefined();
      expect(user?.name).toBe('Abebe Admin');
      expect(user?.role).toBe('admin');
      expect(user?.isVerified).toBe(true);
      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe(password); // Hashed

      const isMatch = await comparePassword(password, user!.passwordHash);
      expect(isMatch).toBe(true);

      // Verify AuditLog record in DB
      const auditLog = await AuditLog.findOne({
        targetId: user?._id,
        action: 'admin_provisioned',
      });
      expect(auditLog).toBeDefined();
      expect(auditLog?.targetType).toBe('user');
      expect(auditLog?.actorId.toString()).toBe(user?._id.toString());
      expect(auditLog?.metadata?.email).toBe(email);
    });

    it('uses default admin name if name is not explicitly specified', async () => {
      const origEnvName = process.env.INITIAL_ADMIN_NAME;
      delete process.env.INITIAL_ADMIN_NAME;
      try {
        const result = await provisionAdmin({
          email: 'defaultname@temarihub.et',
          password: 'ValidPassword123!',
          disconnectOnFinish: false,
        });

        expect(result.status).toBe('created');
        const user = await User.findOne({ email: 'defaultname@temarihub.et' });
        expect(user?.name).toBe('TemariHub Administrator');
      } finally {
        if (origEnvName) process.env.INITIAL_ADMIN_NAME = origEnvName;
      }
    });
  });

  describe('2. Idempotency & Duplicate Prevention', () => {
    it('safely exits without duplicate creation if admin already exists', async () => {
      const email = 'existingadmin@temarihub.et';
      const password = 'FirstPassword123!';

      // First run: creates
      const firstResult = await provisionAdmin({
        email,
        password,
        disconnectOnFinish: false,
      });
      expect(firstResult.status).toBe('created');

      const countBefore = await User.countDocuments({ email });
      expect(countBefore).toBe(1);

      // Second run: exits safely without creating duplicates
      const secondResult = await provisionAdmin({
        email,
        password: 'DifferentPassword123!',
        disconnectOnFinish: false,
      });

      expect(secondResult.status).toBe('already_exists');
      expect(secondResult.email).toBe(email);
      expect(secondResult.userId).toBe(firstResult.userId);

      const countAfter = await User.countDocuments({ email });
      expect(countAfter).toBe(1);
    });
  });

  describe('3. Prevention of Automatic Role Escalation', () => {
    it('refuses to automatically promote an existing student account to administrator', async () => {
      const studentEmail = 'student@astu.edu.et';
      const studentHash = await hashPassword('StudentPass123!');

      await User.create({
        name: 'Normal Student',
        email: studentEmail,
        passwordHash: studentHash,
        role: 'student',
        isVerified: true,
      });

      // Attempt to provision admin with student's email
      await expect(
        provisionAdmin({
          email: studentEmail,
          password: 'AdminPassword123!',
          disconnectOnFinish: false,
        })
      ).rejects.toThrow(
        /Refusing to automatically promote existing user.*with role 'student' to administrator/
      );

      // Verify role was NOT escalated
      const userAfter = await User.findOne({ email: studentEmail });
      expect(userAfter?.role).toBe('student');

      // Verify no audit log for admin provisioning was created
      const audit = await AuditLog.findOne({ 'metadata.email': studentEmail });
      expect(audit).toBeNull();
    });

    it('refuses to automatically promote an existing submitter account to administrator', async () => {
      const submitterEmail = 'recruiter@ethiopiacompany.et';
      const submitterHash = await hashPassword('RecruiterPass123!');

      await User.create({
        name: 'Company Recruiter',
        email: submitterEmail,
        passwordHash: submitterHash,
        role: 'submitter',
        isVerified: true,
      });

      await expect(
        provisionAdmin({
          email: submitterEmail,
          password: 'AdminPassword123!',
          disconnectOnFinish: false,
        })
      ).rejects.toThrow(
        /Refusing to automatically promote existing user.*with role 'submitter' to administrator/
      );

      const userAfter = await User.findOne({ email: submitterEmail });
      expect(userAfter?.role).toBe('submitter');
    });
  });

  describe('4. Input Validation & Error Handling', () => {
    it('rejects when email is missing or empty', async () => {
      await expect(
        provisionAdmin({
          email: '',
          password: 'ValidPassword123!',
          disconnectOnFinish: false,
        })
      ).rejects.toThrow(/INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required/);
    });

    it('rejects when password is missing or empty', async () => {
      await expect(
        provisionAdmin({
          email: 'admin@temarihub.et',
          password: '',
          disconnectOnFinish: false,
        })
      ).rejects.toThrow(/INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required/);
    });

    it('rejects passwords shorter than 8 characters', async () => {
      await expect(
        provisionAdmin({
          email: 'admin@temarihub.et',
          password: 'short',
          disconnectOnFinish: false,
        })
      ).rejects.toThrow(/Admin password must be at least 8 characters long/);
    });
  });
});
