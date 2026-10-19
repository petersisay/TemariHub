import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { StudentProfile } from '../src/models/StudentProfile.js';
import { Organization } from '../src/models/Organization.js';
import { Opportunity } from '../src/models/Opportunity.js';
import { SavedOpportunity } from '../src/models/SavedOpportunity.js';
import { ApplicationTracker } from '../src/models/ApplicationTracker.js';
import { Notification } from '../src/models/Notification.js';
import { OpportunityReport } from '../src/models/OpportunityReport.js';
import { AuditLog } from '../src/models/AuditLog.js';

describe('Database Models & Schema Validation Tests', () => {
  it('validates User model constraints and rejects duplicate emails', async () => {
    await User.init();
    await User.create({
      name: 'User One',
      email: 'unique@astu.edu.et',
      passwordHash: 'hash12345678',
      role: 'student',
    });

    // Duplicate email
    await expect(
      User.create({
        name: 'User Two',
        email: 'unique@astu.edu.et',
        passwordHash: 'hash87654321',
        role: 'student',
      })
    ).rejects.toThrow();
  });

  it('validates StudentProfile required fields and defaults', async () => {
    const user = await User.create({
      name: 'Student Profile Test',
      email: 'profile.test@astu.edu.et',
      passwordHash: 'hashed12345',
      role: 'student',
    });

    const profile = await StudentProfile.create({
      userId: user._id,
      university: 'Adama Science and Technology University',
      fieldOfStudy: 'Software Engineering',
      degreeLevel: 'undergraduate',
      graduationYear: 2026,
    });

    expect(profile.userId.toString()).toBe(user._id.toString());
    expect(profile.skills).toEqual([]);
    expect(profile.preferredArrangements).toEqual([]);
  });

  it('validates Organization model creation and slug', async () => {
    const owner = await User.create({
      name: 'Org Owner',
      email: 'owner@techcorp.et',
      passwordHash: 'hashedpassword',
      role: 'submitter',
    });

    const org = await Organization.create({
      name: 'Tech Corp Ethiopia',
      slug: 'tech-corp-ethiopia',
      isVerified: true,
      contactEmail: 'contact@techcorp.et',
      createdBy: owner._id,
    });

    expect(org._id).toBeDefined();
    expect(org.isVerified).toBe(true);
  });

  it('validates Opportunity model with default moderationState and search fields', async () => {
    const submitter = await User.create({
      name: 'Opportunity Submitter',
      email: 'sub@company.com',
      passwordHash: 'hashedpassword',
      role: 'submitter',
    });

    const opportunity = await Opportunity.create({
      title: 'Junior Backend Developer Internship',
      slug: 'junior-backend-developer-internship',
      organization: {
        name: 'Addis Software',
        isVerified: true,
      },
      opportunityType: 'internship',
      description: 'Exciting backend role for students.',
      eligibleFields: ['Computer Science', 'Software Engineering'],
      eligibleLevels: ['undergraduate', 'recent_graduate'],
      requiredSkills: ['Node.js', 'TypeScript', 'MongoDB'],
      location: 'Addis Ababa',
      workArrangement: 'hybrid',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isRollingDeadline: false,
      compensation: {
        type: 'paid',
        amount: 8000,
        currency: 'ETB',
        period: 'monthly',
      },
      originalSourceUrl: 'https://example.com/original',
      applicationUrl: 'https://example.com/apply',
      submittedBy: submitter._id,
    });

    expect(opportunity._id).toBeDefined();
    expect(opportunity.moderationStatus).toBe('pending');
    expect(opportunity.publicationStatus).toBe('draft');
  });

  it('enforces compound unique index on SavedOpportunity ({ userId, opportunityId })', async () => {
    await SavedOpportunity.init();
    const user = await User.create({
      name: 'Saver Student',
      email: 'saver@astu.edu.et',
      passwordHash: 'hashedpassword',
      role: 'student',
    });

    const fakeOpportunityId = new mongoose.Types.ObjectId();

    await SavedOpportunity.create({
      userId: user._id,
      opportunityId: fakeOpportunityId,
    });

    // Duplicate save must be rejected
    await expect(
      SavedOpportunity.create({
        userId: user._id,
        opportunityId: fakeOpportunityId,
      })
    ).rejects.toThrow();
  });

  it('enforces compound unique index and valid status enum on ApplicationTracker', async () => {
    await ApplicationTracker.init();
    const user = await User.create({
      name: 'Tracker Student',
      email: 'tracker@astu.edu.et',
      passwordHash: 'hashedpassword',
      role: 'student',
    });

    const fakeOppId = new mongoose.Types.ObjectId();

    const tracker = await ApplicationTracker.create({
      userId: user._id,
      opportunityId: fakeOppId,
      status: 'Applied',
      appliedDate: new Date(),
      privateNotes: 'Applied via portal on Monday',
    });

    expect(tracker.status).toBe('Applied');

    // Duplicate tracker record must be rejected
    await expect(
      ApplicationTracker.create({
        userId: user._id,
        opportunityId: fakeOppId,
        status: 'Interview',
      })
    ).rejects.toThrow();
  });

  it('validates Notification, OpportunityReport, and AuditLog schemas', async () => {
    const actor = await User.create({
      name: 'Audit Actor',
      email: 'actor@temarihub.et',
      passwordHash: 'hashedpassword',
      role: 'admin',
    });

    // 1. Notification
    const notif = await Notification.create({
      recipientId: actor._id,
      title: 'Application Update',
      message: 'Your opportunity was approved.',
      type: 'submission_approved',
    });
    expect(notif.isRead).toBe(false);

    // 2. OpportunityReport
    const report = await OpportunityReport.create({
      opportunityId: new mongoose.Types.ObjectId(),
      reportedBy: actor._id,
      reason: 'suspicious_scam',
      details: 'Suspicious request for application fee.',
    });
    expect(report.status).toBe('pending');

    // 3. AuditLog
    const log = await AuditLog.create({
      actorId: actor._id,
      actorRole: 'admin',
      action: 'opportunity_approve',
      targetType: 'opportunity',
      targetId: report.opportunityId,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });
    expect(log.timestamp).toBeDefined();
    expect(log.action).toBe('opportunity_approve');
  });
});
