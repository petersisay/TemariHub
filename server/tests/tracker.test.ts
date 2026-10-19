import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Opportunity } from '../src/models/Opportunity.js';
import { SavedOpportunity } from '../src/models/SavedOpportunity.js';
import { ApplicationTracker } from '../src/models/ApplicationTracker.js';
import { hashPassword } from '../src/utils/password.js';

describe('Student Application Tracker & Bookmarks Integration Tests', () => {
  const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' };

  let studentA: any;
  let studentACookie: string;
  let studentB: any;
  let studentBCookie: string;
  let sampleOpportunity: any;

  beforeEach(async () => {
    await ApplicationTracker.deleteMany({});
    await SavedOpportunity.deleteMany({});
    await Opportunity.deleteMany({});
    await User.deleteMany({});

    // Create Student A
    studentA = await User.create({
      name: 'Student A',
      email: 'studentA@astu.edu.et',
      passwordHash: await hashPassword('Password123!'),
      role: 'student',
      isVerified: true,
    });
    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({ email: 'studentA@astu.edu.et', password: 'Password123!' });
    studentACookie = loginA.headers['set-cookie'][0];

    // Create Student B
    studentB = await User.create({
      name: 'Student B',
      email: 'studentB@aau.edu.et',
      passwordHash: await hashPassword('Password123!'),
      role: 'student',
      isVerified: true,
    });
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({ email: 'studentB@aau.edu.et', password: 'Password123!' });
    studentBCookie = loginB.headers['set-cookie'][0];

    // Create Opportunity
    sampleOpportunity = await Opportunity.create({
      title: 'Software Developer Intern',
      slug: 'software-developer-intern-sample',
      organization: { name: 'Ethiopia Tech', isVerified: true },
      opportunityType: 'internship',
      description: 'Software development internship.',
      location: 'Addis Ababa',
      workArrangement: 'hybrid',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      originalSourceUrl: 'https://example.com/source',
      applicationUrl: 'https://example.com/apply',
      moderationStatus: 'approved',
      publicationStatus: 'published',
      submittedBy: studentA._id,
      savesCount: 0,
    });
  });

  describe('1. Opportunity Bookmarking (Saved Opportunities)', () => {
    it('bookmarks an opportunity and prevents duplicate entries', async () => {
      // First save
      const res1 = await request(app)
        .post(`/api/v1/saved-opportunities/${sampleOpportunity._id}`)
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data.saved).toBe(true);

      const dbCount = await SavedOpportunity.countDocuments({
        userId: studentA._id,
        opportunityId: sampleOpportunity._id,
      });
      expect(dbCount).toBe(1);

      // Verify savesCount increment
      const oppAfterSave = await Opportunity.findById(sampleOpportunity._id);
      expect(oppAfterSave?.savesCount).toBe(1);

      // Second save (Idempotent duplicate attempt)
      const res2 = await request(app)
        .post(`/api/v1/saved-opportunities/${sampleOpportunity._id}`)
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie);

      expect(res2.status).toBe(200);
      expect(res2.body.data.saved).toBe(true);

      // No duplicate record created in database
      const countAfter = await SavedOpportunity.countDocuments({
        userId: studentA._id,
        opportunityId: sampleOpportunity._id,
      });
      expect(countAfter).toBe(1);
    });

    it('retrieves saved opportunities populated with details', async () => {
      await request(app)
        .post(`/api/v1/saved-opportunities/${sampleOpportunity._id}`)
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie);

      const res = await request(app)
        .get('/api/v1/saved-opportunities')
        .set('Cookie', studentACookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].opportunity.title).toBe('Software Developer Intern');
      expect(res.body.data[0].opportunityId).toBe(sampleOpportunity._id.toString());
    });

    it('unsaves an opportunity and decrements savesCount', async () => {
      // Save first
      await request(app)
        .post(`/api/v1/saved-opportunities/${sampleOpportunity._id}`)
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie);

      // Unsave
      const deleteRes = await request(app)
        .delete(`/api/v1/saved-opportunities/${sampleOpportunity._id}`)
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.saved).toBe(false);

      const count = await SavedOpportunity.countDocuments({
        userId: studentA._id,
        opportunityId: sampleOpportunity._id,
      });
      expect(count).toBe(0);

      const opp = await Opportunity.findById(sampleOpportunity._id);
      expect(opp?.savesCount).toBe(0);
    });
  });

  describe('2. Application Tracker CRUD & Status Transitions', () => {
    it('adds an opportunity to the tracker and transitions through status stages', async () => {
      // 1. Add to tracker as 'Preparing'
      const addRes = await request(app)
        .post('/api/v1/tracker')
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie)
        .send({
          opportunityId: sampleOpportunity._id.toString(),
          status: 'Preparing',
          privateNotes: 'Preparing CV and cover letter tailored for this role.',
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.status).toBe('Preparing');
      expect(addRes.body.data.privateNotes).toContain('Preparing CV');
      const trackerId = addRes.body.data.id;

      // 2. Transition status to 'Applied'
      const updateRes1 = await request(app)
        .put(`/api/v1/tracker/${trackerId}`)
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie)
        .send({
          status: 'Applied',
          appliedDate: new Date().toISOString(),
          privateNotes: 'Submitted application on official portal.',
        });

      expect(updateRes1.status).toBe(200);
      expect(updateRes1.body.data.status).toBe('Applied');
      expect(updateRes1.body.data.appliedDate).toBeDefined();

      // 3. Transition status to 'Interview'
      const updateRes2 = await request(app)
        .put(`/api/v1/tracker/${trackerId}`)
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie)
        .send({
          status: 'Interview',
          privateNotes: 'Interview scheduled for next Thursday at 10 AM.',
        });

      expect(updateRes2.status).toBe(200);
      expect(updateRes2.body.data.status).toBe('Interview');

      // 4. Verify in DB
      const dbItem = await ApplicationTracker.findById(trackerId);
      expect(dbItem?.status).toBe('Interview');
    });

    it('returns student application metrics on /tracker/stats', async () => {
      await request(app)
        .post('/api/v1/tracker')
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie)
        .send({
          opportunityId: sampleOpportunity._id.toString(),
          status: 'Applied',
        });

      const res = await request(app)
        .get('/api/v1/tracker/stats')
        .set('Cookie', studentACookie);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.byStatus.Applied).toBe(1);
      expect(res.body.data.activeApplications).toBe(1);
    });
  });

  describe('3. Strict Cross-User Ownership Boundaries', () => {
    it('blocks Student B from updating Student A tracker entry with 403 Forbidden', async () => {
      // Student A creates tracker entry
      const createRes = await request(app)
        .post('/api/v1/tracker')
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie)
        .send({
          opportunityId: sampleOpportunity._id.toString(),
          status: 'Interested',
          privateNotes: 'Student A private notes.',
        });
      const trackerId = createRes.body.data.id;

      // Student B attempts to modify Student A's entry
      const maliciousRes = await request(app)
        .put(`/api/v1/tracker/${trackerId}`)
        .set(CSRF_HEADER)
        .set('Cookie', studentBCookie)
        .send({
          status: 'Accepted',
          privateNotes: 'Hacked by Student B',
        });

      expect(maliciousRes.status).toBe(403);
      expect(maliciousRes.body.success).toBe(false);
      expect(maliciousRes.body.message).toContain('not authorized to modify this tracking entry');

      // Verify Student A's data was NOT altered
      const itemAfter = await ApplicationTracker.findById(trackerId);
      expect(itemAfter?.status).toBe('Interested');
      expect(itemAfter?.privateNotes).toBe('Student A private notes.');
    });

    it('blocks Student B from deleting Student A tracker entry with 403 Forbidden', async () => {
      const createRes = await request(app)
        .post('/api/v1/tracker')
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie)
        .send({
          opportunityId: sampleOpportunity._id.toString(),
          status: 'Interested',
        });
      const trackerId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/tracker/${trackerId}`)
        .set(CSRF_HEADER)
        .set('Cookie', studentBCookie);

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.success).toBe(false);

      const stillExists = await ApplicationTracker.findById(trackerId);
      expect(stillExists).toBeDefined();
    });

    it('allows owner to successfully delete their own tracker entry', async () => {
      const createRes = await request(app)
        .post('/api/v1/tracker')
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie)
        .send({
          opportunityId: sampleOpportunity._id.toString(),
          status: 'Interested',
        });
      const trackerId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/tracker/${trackerId}`)
        .set(CSRF_HEADER)
        .set('Cookie', studentACookie);

      expect(deleteRes.status).toBe(200);

      const deleted = await ApplicationTracker.findById(trackerId);
      expect(deleted).toBeNull();
    });
  });
});
