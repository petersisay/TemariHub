import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Opportunity } from '../src/models/Opportunity.js';
import { OpportunityReport } from '../src/models/OpportunityReport.js';
import { hashPassword } from '../src/utils/password.js';

describe('Opportunity Discovery & Submission Integration Tests', () => {
  const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' };

  let studentCookie: string;
  let submitterCookie: string;
  let adminCookie: string;
  let submitterUser: any;
  let adminUser: any;
  let studentUser: any;

  beforeEach(async () => {
    await Opportunity.deleteMany({});
    await OpportunityReport.deleteMany({});
    await User.deleteMany({});

    // 1. Create Student
    studentUser = await User.create({
      name: 'Abebe Student',
      email: 'student@astu.edu.et',
      passwordHash: await hashPassword('Password123!'),
      role: 'student',
      isVerified: true,
    });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({ email: 'student@astu.edu.et', password: 'Password123!' });
    studentCookie = studentLogin.headers['set-cookie'][0];

    // 2. Create Submitter
    submitterUser = await User.create({
      name: 'Recruiter User',
      email: 'recruiter@ethiopiatech.com',
      passwordHash: await hashPassword('Password123!'),
      role: 'submitter',
      isVerified: true,
    });

    const submitterLogin = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({ email: 'recruiter@ethiopiatech.com', password: 'Password123!' });
    submitterCookie = submitterLogin.headers['set-cookie'][0];

    // 3. Create Admin
    adminUser = await User.create({
      name: 'Lead Admin',
      email: 'admin@temarihub.et',
      passwordHash: await hashPassword('Password123!'),
      role: 'admin',
      isVerified: true,
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({ email: 'admin@temarihub.et', password: 'Password123!' });
    adminCookie = adminLogin.headers['set-cookie'][0];
  });

  describe('1. Public Opportunity Discovery & Visibility Invariants', () => {
    it('returns only approved and published opportunities in the public feed', async () => {
      // Create one approved & published listing
      await Opportunity.create({
        title: 'Published Software Internship',
        slug: 'published-software-internship',
        organization: { name: 'Tech Ethiopia', isVerified: true },
        opportunityType: 'internship',
        description: 'Build modern cloud systems in Addis Ababa.',
        eligibleFields: ['Software Engineering'],
        eligibleLevels: ['undergraduate'],
        requiredSkills: ['Node.js'],
        location: 'Addis Ababa',
        workArrangement: 'hybrid',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        originalSourceUrl: 'https://example.com/source',
        applicationUrl: 'https://example.com/apply',
        moderationStatus: 'approved',
        publicationStatus: 'published',
        submittedBy: submitterUser._id,
      });

      // Create one pending moderation listing
      await Opportunity.create({
        title: 'Secret Pending Hackathon',
        slug: 'secret-pending-hackathon',
        organization: { name: 'Unknown Club' },
        opportunityType: 'hackathon',
        description: 'Unmoderated draft listing.',
        eligibleFields: ['Computer Science'],
        eligibleLevels: ['undergraduate'],
        location: 'Hawassa',
        workArrangement: 'on_site',
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        originalSourceUrl: 'https://example.com/unverified',
        applicationUrl: 'https://example.com/apply',
        moderationStatus: 'pending',
        publicationStatus: 'draft',
        submittedBy: submitterUser._id,
      });

      // Create one rejected listing
      await Opportunity.create({
        title: 'Spam Opportunity',
        slug: 'spam-opportunity',
        organization: { name: 'Spam Co' },
        opportunityType: 'internship',
        description: 'Spam details.',
        eligibleFields: ['All STEM Disciplines'],
        location: 'Addis Ababa',
        workArrangement: 'remote',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        originalSourceUrl: 'https://example.com/spam',
        applicationUrl: 'https://example.com/apply',
        moderationStatus: 'rejected',
        publicationStatus: 'draft',
        submittedBy: submitterUser._id,
      });

      const res = await request(app).get('/api/v1/opportunities');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].title).toBe('Published Software Internship');
      expect(res.body.data.total).toBe(1);

      // Verify pending and rejected listings NEVER leak
      const titles = res.body.data.items.map((i: any) => i.title);
      expect(titles).not.toContain('Secret Pending Hackathon');
      expect(titles).not.toContain('Spam Opportunity');
    });

    it('filters opportunities by search query, opportunityType, location, and arrangement', async () => {
      await Opportunity.create([
        {
          title: 'Full-Stack Developer Intern',
          slug: 'full-stack-developer-intern',
          organization: { name: 'Safaricom Ethiopia', isVerified: true },
          opportunityType: 'internship',
          description: 'Develop scalable backend microservices and React web frontends.',
          eligibleFields: ['Software Engineering', 'Computer Science'],
          eligibleLevels: ['undergraduate'],
          requiredSkills: ['React', 'TypeScript', 'Node.js'],
          location: 'Addis Ababa',
          workArrangement: 'hybrid',
          deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          originalSourceUrl: 'https://safaricom.et/intern',
          applicationUrl: 'https://safaricom.et/apply',
          moderationStatus: 'approved',
          publicationStatus: 'published',
          submittedBy: submitterUser._id,
        },
        {
          title: 'ASTU Robotics Hackathon',
          slug: 'astu-robotics-hackathon',
          organization: { name: 'ASTU Robotics Club', isVerified: true },
          opportunityType: 'hackathon',
          description: '48-hour hardware and IoT programming competition.',
          eligibleFields: ['Electrical Engineering', 'All STEM Disciplines'],
          eligibleLevels: ['undergraduate', 'postgraduate'],
          requiredSkills: ['C++', 'Arduino', 'Python'],
          location: 'Adama',
          workArrangement: 'on_site',
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          originalSourceUrl: 'https://astu.edu.et/hackathon',
          applicationUrl: 'https://astu.edu.et/apply',
          moderationStatus: 'approved',
          publicationStatus: 'published',
          submittedBy: submitterUser._id,
        },
      ]);

      // Search by keyword
      const searchRes = await request(app).get('/api/v1/opportunities?search=Safaricom');
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.items).toHaveLength(1);
      expect(searchRes.body.data.items[0].title).toBe('Full-Stack Developer Intern');

      // Filter by type
      const typeRes = await request(app).get('/api/v1/opportunities?types=hackathon');
      expect(typeRes.status).toBe(200);
      expect(typeRes.body.data.items).toHaveLength(1);
      expect(typeRes.body.data.items[0].title).toBe('ASTU Robotics Hackathon');

      // Filter by location
      const locRes = await request(app).get('/api/v1/opportunities?location=Adama');
      expect(locRes.status).toBe(200);
      expect(locRes.body.data.items).toHaveLength(1);
      expect(locRes.body.data.items[0].location).toBe('Adama');
    });

    it('excludes expired opportunities by default unless includeExpired is true', async () => {
      // Active listing
      await Opportunity.create({
        title: 'Active Opportunity',
        slug: 'active-opportunity',
        organization: { name: 'Active Org' },
        opportunityType: 'internship',
        description: 'Active description',
        location: 'Addis Ababa',
        workArrangement: 'on_site',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        originalSourceUrl: 'https://example.com/source',
        applicationUrl: 'https://example.com/apply',
        moderationStatus: 'approved',
        publicationStatus: 'published',
        submittedBy: submitterUser._id,
      });

      // Expired listing
      await Opportunity.create({
        title: 'Old Expired Opportunity',
        slug: 'old-expired-opportunity',
        organization: { name: 'Past Org' },
        opportunityType: 'scholarship',
        description: 'Expired description',
        location: 'Addis Ababa',
        workArrangement: 'on_site',
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Past
        originalSourceUrl: 'https://example.com/source',
        applicationUrl: 'https://example.com/apply',
        moderationStatus: 'approved',
        publicationStatus: 'expired',
        submittedBy: submitterUser._id,
      });

      // Default query: expired excluded
      const resDefault = await request(app).get('/api/v1/opportunities');
      expect(resDefault.body.data.items).toHaveLength(1);
      expect(resDefault.body.data.items[0].title).toBe('Active Opportunity');

      // With includeExpired=true
      const resWithExpired = await request(app).get('/api/v1/opportunities?includeExpired=true');
      expect(resWithExpired.body.data.items).toHaveLength(2);
    });
  });

  describe('2. Single Opportunity Details & Slug Access', () => {
    it('retrieves an opportunity by slug and increments views count', async () => {
      const opp = await Opportunity.create({
        title: 'AI Engineering Fellowship',
        slug: 'ai-engineering-fellowship-2026',
        organization: { name: 'EAII', isVerified: true },
        opportunityType: 'fellowship',
        description: 'Research fellowship in computer vision and NLP.',
        location: 'Addis Ababa',
        workArrangement: 'on_site',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        originalSourceUrl: 'https://eaiss.gov.et',
        applicationUrl: 'https://eaiss.gov.et/apply',
        moderationStatus: 'approved',
        publicationStatus: 'published',
        submittedBy: submitterUser._id,
        viewsCount: 5,
      });

      const res = await request(app).get('/api/v1/opportunities/ai-engineering-fellowship-2026');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('AI Engineering Fellowship');

      // Verify view counter increment in DB
      const updated = await Opportunity.findById(opp._id);
      expect(updated?.viewsCount).toBe(6);
    });

    it('returns 404 for non-published listings when requested by general public', async () => {
      await Opportunity.create({
        title: 'Draft Opportunity',
        slug: 'draft-opportunity-private',
        organization: { name: 'Private Corp' },
        opportunityType: 'internship',
        description: 'Private draft',
        location: 'Addis Ababa',
        workArrangement: 'on_site',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        originalSourceUrl: 'https://example.com/source',
        applicationUrl: 'https://example.com/apply',
        moderationStatus: 'pending',
        publicationStatus: 'draft',
        submittedBy: submitterUser._id,
      });

      const res = await request(app).get('/api/v1/opportunities/draft-opportunity-private');
      expect(res.status).toBe(404);
    });
  });

  describe('3. Opportunity Submission Flow', () => {
    it('allows a submitter to create an opportunity in pending moderation status', async () => {
      const res = await request(app)
        .post('/api/v1/opportunities/submit')
        .set(CSRF_HEADER)
        .set('Cookie', submitterCookie)
        .send({
          title: 'Cloud DevOps Intern',
          organization: {
            name: 'Ethio Telecom Innovation Lab',
            websiteUrl: 'https://ethiotelecom.et',
          },
          opportunityType: 'internship',
          description: 'Hands-on Kubernetes, Linux, and Terraform cloud deployment training for university students.',
          eligibleFields: ['Computer Science', 'Software Engineering'],
          eligibleLevels: ['undergraduate', 'recent_graduate'],
          requiredSkills: ['Linux', 'Docker', 'Bash'],
          location: 'Addis Ababa',
          workArrangement: 'hybrid',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          originalSourceUrl: 'https://ethiotelecom.et/careers/devops-intern',
          applicationUrl: 'https://ethiotelecom.et/apply',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.moderationStatus).toBe('pending');
      expect(res.body.data.publicationStatus).toBe('draft');
      expect(res.body.data.slug).toContain('cloud-devops-intern');

      // Verify in DB
      const dbOpp = await Opportunity.findById(res.body.data.id);
      expect(dbOpp).toBeDefined();
      expect(dbOpp?.moderationStatus).toBe('pending');
      expect(dbOpp?.submittedBy.toString()).toBe(submitterUser._id.toString());
    });

    it('rejects submissions missing required verification or application URLs', async () => {
      const res = await request(app)
        .post('/api/v1/opportunities/submit')
        .set(CSRF_HEADER)
        .set('Cookie', submitterCookie)
        .send({
          title: 'Incomplete Listing',
          organization: { name: 'Some Org' },
          opportunityType: 'internship',
          description: 'Short desc',
          location: 'Addis Ababa',
          deadline: new Date().toISOString(),
          // Missing originalSourceUrl and applicationUrl
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Opportunity Reporting Flow', () => {
    it('allows an authenticated user to report a listing and increments reportCount', async () => {
      const opp = await Opportunity.create({
        title: 'Reportable Opportunity',
        slug: 'reportable-opportunity',
        organization: { name: 'Old Company' },
        opportunityType: 'internship',
        description: 'Listing with broken links',
        location: 'Addis Ababa',
        workArrangement: 'on_site',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        originalSourceUrl: 'https://example.com/source',
        applicationUrl: 'https://example.com/apply',
        moderationStatus: 'approved',
        publicationStatus: 'published',
        submittedBy: submitterUser._id,
        reportCount: 0,
      });

      const res = await request(app)
        .post(`/api/v1/opportunities/${opp._id}/report`)
        .set(CSRF_HEADER)
        .set('Cookie', studentCookie)
        .send({
          reason: 'broken_link',
          details: 'The official application page returns 404 Not Found since this morning.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const report = await OpportunityReport.findOne({ opportunityId: opp._id });
      expect(report).toBeDefined();
      expect(report?.reason).toBe('broken_link');
      expect(report?.status).toBe('pending');

      const updatedOpp = await Opportunity.findById(opp._id);
      expect(updatedOpp?.reportCount).toBe(1);
    });
  });
});
