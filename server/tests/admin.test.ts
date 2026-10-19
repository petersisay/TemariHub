import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Opportunity } from '../src/models/Opportunity.js';
import { OpportunityReport } from '../src/models/OpportunityReport.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { hashPassword } from '../src/utils/password.js';

describe('Admin Moderation, Reports & Audit Logging Integration Tests', () => {
  const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' };

  let adminUser: any;
  let adminCookie: string;
  let submitterUser: any;
  let submitterCookie: string;
  let studentUser: any;
  let studentCookie: string;

  beforeEach(async () => {
    await AuditLog.deleteMany({});
    await OpportunityReport.deleteMany({});
    await Opportunity.deleteMany({});
    await User.deleteMany({});

    // 1. Create Admin
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@temarihub.et',
      passwordHash: await hashPassword('AdminPass123!'),
      role: 'admin',
      isVerified: true,
    });
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({ email: 'admin@temarihub.et', password: 'AdminPass123!' });
    adminCookie = adminLogin.headers['set-cookie'][0];

    // 2. Create Submitter
    submitterUser = await User.create({
      name: 'Tech Recruiter',
      email: 'recruiter@company.et',
      passwordHash: await hashPassword('RecruiterPass123!'),
      role: 'submitter',
      isVerified: true,
    });
    const submitterLogin = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({ email: 'recruiter@company.et', password: 'RecruiterPass123!' });
    submitterCookie = submitterLogin.headers['set-cookie'][0];

    // 3. Create Student
    studentUser = await User.create({
      name: 'ASTU Student',
      email: 'student@astu.edu.et',
      passwordHash: await hashPassword('StudentPass123!'),
      role: 'student',
      isVerified: true,
    });
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({ email: 'student@astu.edu.et', password: 'StudentPass123!' });
    studentCookie = studentLogin.headers['set-cookie'][0];
  });

  describe('1. Role Authorization Boundaries', () => {
    it('denies student access to admin moderation queue with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/moderation/queue')
        .set('Cookie', studentCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('denies submitter access to admin moderation queue with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/moderation/queue')
        .set('Cookie', submitterCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('permits administrator access to moderation queue', async () => {
      const res = await request(app)
        .get('/api/v1/admin/moderation/queue')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('2. Moderation Decision Workflow & Audit Logging', () => {
    it('approves a pending opportunity, publishes it, and records an audit log', async () => {
      // Create pending listing
      const pendingOpp = await Opportunity.create({
        title: 'Pending Telecom Internship',
        slug: 'pending-telecom-internship',
        organization: { name: 'Telecom Corp', isVerified: false },
        opportunityType: 'internship',
        description: 'Pending review description.',
        location: 'Addis Ababa',
        workArrangement: 'hybrid',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        originalSourceUrl: 'https://example.com/source',
        applicationUrl: 'https://example.com/apply',
        moderationStatus: 'pending',
        publicationStatus: 'draft',
        submittedBy: submitterUser._id,
      });

      // Verify not yet in public feed
      const beforeApprove = await request(app).get('/api/v1/opportunities');
      expect(beforeApprove.body.data.items).toHaveLength(0);

      // Admin approves
      const approveRes = await request(app)
        .put(`/api/v1/admin/moderation/${pendingOpp._id}/decision`)
        .set(CSRF_HEADER)
        .set('Cookie', adminCookie)
        .send({
          decision: 'approve',
          reviewNotes: 'Source verified with official company announcement.',
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);
      expect(approveRes.body.data.moderationStatus).toBe('approved');
      expect(approveRes.body.data.publicationStatus).toBe('published');

      // Verify it now appears in public feed
      const afterApprove = await request(app).get('/api/v1/opportunities');
      expect(afterApprove.body.data.items).toHaveLength(1);
      expect(afterApprove.body.data.items[0].title).toBe('Pending Telecom Internship');

      // Verify AuditLog entry
      const audit = await AuditLog.findOne({
        targetId: pendingOpp._id,
        action: 'opportunity_approve',
      });
      expect(audit).toBeDefined();
      expect(audit?.targetType).toBe('opportunity');
      expect(audit?.actorId.toString()).toBe(adminUser._id.toString());
      expect(audit?.metadata?.decision).toBe('approve');
      expect(audit?.metadata?.reviewNotes).toContain('Source verified');
    });

    it('rejects a pending opportunity and records an audit log', async () => {
      const pendingOpp = await Opportunity.create({
        title: 'Suspicious Job Offer',
        slug: 'suspicious-job-offer',
        organization: { name: 'Unknown Entity' },
        opportunityType: 'entry_level_job',
        description: 'Asking for application fees.',
        location: 'Addis Ababa',
        workArrangement: 'remote',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        originalSourceUrl: 'https://suspicious.example.com',
        applicationUrl: 'https://suspicious.example.com/pay',
        moderationStatus: 'pending',
        publicationStatus: 'draft',
        submittedBy: submitterUser._id,
      });

      const rejectRes = await request(app)
        .put(`/api/v1/admin/moderation/${pendingOpp._id}/decision`)
        .set(CSRF_HEADER)
        .set('Cookie', adminCookie)
        .send({
          decision: 'reject',
          reviewNotes: 'Violates policy: Application fees requested.',
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.moderationStatus).toBe('rejected');
      expect(rejectRes.body.data.publicationStatus).toBe('draft');

      const audit = await AuditLog.findOne({
        targetId: pendingOpp._id,
        action: 'opportunity_reject',
      });
      expect(audit).toBeDefined();
      expect(audit?.metadata?.decision).toBe('reject');
    });
  });

  describe('3. Report Review & Resolution', () => {
    it('allows admin to list and resolve community reports with audit logs', async () => {
      const opp = await Opportunity.create({
        title: 'Listing With Broken Link',
        slug: 'listing-with-broken-link',
        organization: { name: 'Company' },
        opportunityType: 'internship',
        description: 'Description',
        location: 'Addis Ababa',
        workArrangement: 'on_site',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        originalSourceUrl: 'https://example.com/source',
        applicationUrl: 'https://example.com/broken',
        moderationStatus: 'approved',
        publicationStatus: 'published',
        submittedBy: submitterUser._id,
      });

      const report = await OpportunityReport.create({
        opportunityId: opp._id,
        reportedBy: studentUser._id,
        reason: 'broken_link',
        details: 'Direct application URL returns 404.',
        status: 'pending',
      });

      // Admin lists reports
      const listRes = await request(app)
        .get('/api/v1/admin/reports')
        .set('Cookie', adminCookie);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(1);
      expect(listRes.body.data[0].reason).toBe('broken_link');

      // Admin resolves report
      const resolveRes = await request(app)
        .put(`/api/v1/admin/reports/${report._id}/resolve`)
        .set(CSRF_HEADER)
        .set('Cookie', adminCookie)
        .send({
          status: 'resolved',
          resolutionNotes: 'Updated application link to working mirror.',
        });

      expect(resolveRes.status).toBe(200);

      const dbReport = await OpportunityReport.findById(report._id);
      expect(dbReport?.status).toBe('resolved');
      expect(dbReport?.resolutionNotes).toContain('Updated application link');

      // Verify audit log
      const audit = await AuditLog.findOne({
        targetId: report._id,
        action: 'report_resolve',
      });
      expect(audit).toBeDefined();
      expect(audit?.targetType).toBe('report');
    });
  });

  describe('4. Audit Logs & System Telemetry', () => {
    it('retrieves audit logs and platform metrics for admin dashboard', async () => {
      await AuditLog.create({
        actorId: adminUser._id,
        action: 'opportunity_approve',
        targetType: 'opportunity',
        targetId: adminUser._id,
        ipAddress: '127.0.0.1',
        metadata: { opportunityTitle: 'Test Opportunity' },
        timestamp: new Date(),
      });

      const logsRes = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Cookie', adminCookie);

      expect(logsRes.status).toBe(200);
      expect(logsRes.body.data).toHaveLength(1);
      expect(logsRes.body.data[0].action).toBe('opportunity_approve');

      const statsRes = await request(app)
        .get('/api/v1/admin/stats')
        .set('Cookie', adminCookie);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.data.totalStudents).toBe(1);
      expect(statsRes.body.data.totalSubmitters).toBe(1);
    });
  });
});
