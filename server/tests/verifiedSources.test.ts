import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Opportunity } from '../src/models/Opportunity.js';
import { TrustedSource } from '../src/models/TrustedSource.js';
import {
  SourceMonitorService,
  setSourceFetcherForTesting,
  resetSourceFetcher,
  validateSafeUrl,
  parseDaadRss,
  parseMlhEvents,
} from '../src/modules/sources/sourceMonitor.service.js';
import {
  setGoogleOAuthClientForTesting,
  resetGoogleOAuthClient,
} from '../src/modules/auth/googleAuth.service.js';

describe('Verified Opportunities, Trusted Sources & Continuous Updates Tests', () => {
  const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' };

  let adminUser: any;
  let adminCookie: string;
  let studentUser: any;
  let studentCookie: string;
  let testSource: any;

  beforeEach(async () => {
    setGoogleOAuthClientForTesting({
      verifyIdToken: async ({ idToken }: { idToken: string }) => {
        if (idToken === 'VALID_ADMIN_TOKEN') {
          return {
            getPayload: () => ({
              sub: 'google_sub_admin_99999',
              email: 'petrossisay1646@gmail.com',
              email_verified: true,
              name: 'Petros Sisay Admin',
            }),
          };
        }
        if (idToken === 'VALID_STUDENT_TOKEN') {
          return {
            getPayload: () => ({
              sub: 'google_sub_student_12345',
              email: 'student@astu.edu.et',
              email_verified: true,
              name: 'Student User',
            }),
          };
        }
        throw new Error('Invalid token');
      },
    });

    // 1. Create Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/google')
      .set(CSRF_HEADER)
      .send({ idToken: 'VALID_ADMIN_TOKEN' });
    adminCookie = adminLogin.headers['set-cookie']?.[0] || '';
    adminUser = await User.findOne({ email: 'petrossisay1646@gmail.com' });

    // 2. Create Student
    const studentLogin = await request(app)
      .post('/api/v1/auth/google')
      .set(CSRF_HEADER)
      .send({ idToken: 'VALID_STUDENT_TOKEN' });
    studentCookie = studentLogin.headers['set-cookie']?.[0] || '';
    studentUser = await User.findOne({ email: 'student@astu.edu.et' });

    // 3. Create a Verified Source
    testSource = await TrustedSource.create({
      name: 'Adama Science and Technology University (ASTU)',
      slug: 'astu-official-portal',
      officialUrl: 'https://astu.edu.et',
      category: 'university',
      verificationStatus: 'approved',
      monitoringMethod: 'official_api',
      monitoringStatus: 'healthy',
      approvedBy: adminUser?._id,
    });
  });

  afterEach(() => {
    resetSourceFetcher();
    resetGoogleOAuthClient();
  });

  describe('1. Trusted Sources Registry & Authorization', () => {
    it('allows public/student to list approved trusted sources', async () => {
      const res = await request(app).get('/api/v1/sources');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].slug).toBe('astu-official-portal');
    });

    it('allows administrator to register a new verified source', async () => {
      const res = await request(app)
        .post('/api/v1/sources')
        .set(CSRF_HEADER)
        .set('Cookie', adminCookie)
        .send({
          name: 'Ethiopian Artificial Intelligence Institute',
          officialUrl: 'https://eaiss.gov.et',
          category: 'government',
          monitoringMethod: 'manual_review',
          notes: 'Official AI institute fellowships',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Ethiopian Artificial Intelligence Institute');
    });

    it('denies non-admin student from creating a trusted source with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/sources')
        .set(CSRF_HEADER)
        .set('Cookie', studentCookie)
        .send({
          name: 'Fake Source Portal',
          officialUrl: 'https://fake.et',
          category: 'corporate',
          monitoringMethod: 'manual_review',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Continuous Source Monitoring & Discovery', () => {
    it('discovers new opportunity into PENDING_REVIEW and tracks material deadline extensions', async () => {
      const existingDeadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const extendedDeadline = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);

      // Pre-seed an existing announcement from this source
      await Opportunity.create({
        title: 'ASTU Renewable Energy Hackathon 2026',
        slug: 'astu-renewable-hackathon-2026',
        organization: { name: 'ASTU ICT Directorate', isVerified: true },
        opportunityType: 'hackathon',
        description: 'Original description for hackathon',
        location: 'Adama',
        deadline: existingDeadline,
        workArrangement: 'on_site',
        originalSourceUrl: 'https://astu.edu.et/hackathons/energy-2026',
        applicationUrl: 'https://astu.edu.et/apply/energy',
        moderationStatus: 'approved',
        publicationStatus: 'published',
        verificationStatus: 'VERIFIED',
        trustedSourceId: testSource._id,
        submittedBy: adminUser._id,
        changeHistory: [],
      });

      // Mock source response: 1 newly discovered + 1 existing with extended deadline
      setSourceFetcherForTesting(async () => [
        {
          title: 'ASTU Renewable Energy Hackathon 2026', // Existing announcement with extended deadline
          organizationName: 'ASTU ICT Directorate',
          opportunityType: 'hackathon',
          description: 'Original description for hackathon',
          location: 'Adama',
          deadline: extendedDeadline,
          originalSourceUrl: 'https://astu.edu.et/hackathons/energy-2026',
          applicationUrl: 'https://astu.edu.et/apply/energy',
        },
        {
          title: 'ASTU AI Embedded Systems Summer Internship', // Brand new announcement
          organizationName: 'ASTU School of Electrical Engineering',
          opportunityType: 'internship',
          description: 'Hands-on embedded systems firmware training on ARM Cortex-M microcontrollers.',
          location: 'Adama',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          originalSourceUrl: 'https://astu.edu.et/internships/embedded-2026',
          applicationUrl: 'https://astu.edu.et/apply/embedded',
        },
      ]);

      // Execute source check
      const checkResult = await SourceMonitorService.checkSource(testSource._id);
      expect(checkResult.newDiscovered).toBe(1);
      expect(checkResult.updated).toBe(1);

      // 1. Verify newly discovered opportunity entered PENDING_REVIEW (NEVER blindly trusted)
      const newOpp = await Opportunity.findOne({
        originalSourceUrl: 'https://astu.edu.et/internships/embedded-2026',
      });
      expect(newOpp).toBeDefined();
      expect(newOpp?.verificationStatus).toBe('PENDING_REVIEW');
      expect(newOpp?.moderationStatus).toBe('pending');
      expect(newOpp?.publicationStatus).toBe('draft');
      expect(newOpp?.sourceType).toBe('automated_feed');

      // 2. Verify existing opportunity detected material deadline extension in changeHistory
      const updatedOpp = await Opportunity.findOne({
        originalSourceUrl: 'https://astu.edu.et/hackathons/energy-2026',
      });
      expect(updatedOpp?.isMateriallyUpdated).toBe(true);
      expect(updatedOpp?.changeHistory.length).toBe(1);
      expect(updatedOpp?.changeHistory[0].fieldChanged).toBe('deadline');
      expect(new Date(updatedOpp!.deadline).getTime()).toBe(extendedDeadline.getTime());

      // 3. Verify total opportunities count did not duplicate
      const totalOpps = await Opportunity.countDocuments();
      expect(totalOpps).toBe(2);
    });
  });

  describe('3. Expiration Sweeping', () => {
    it('automatically transitions opportunities past their deadline to EXPIRED', async () => {
      // Create past-deadline opportunity
      const expiredOpp = await Opportunity.create({
        title: 'Past Summer Fellowship 2025',
        slug: 'past-summer-fellowship-2025',
        organization: { name: 'AAU AI Lab', isVerified: true },
        opportunityType: 'fellowship',
        description: 'Past fellowship',
        location: 'Addis Ababa',
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days in past
        workArrangement: 'on_site',
        originalSourceUrl: 'https://aau.edu.et/past-2025',
        applicationUrl: 'https://aau.edu.et/apply',
        moderationStatus: 'approved',
        publicationStatus: 'published',
        verificationStatus: 'VERIFIED',
        submittedBy: adminUser._id,
      });

      const sweptCount = await SourceMonitorService.sweepExpiredOpportunities();
      expect(sweptCount).toBeGreaterThanOrEqual(1);

      const refreshed = await Opportunity.findById(expiredOpp._id);
      expect(refreshed?.verificationStatus).toBe('EXPIRED');
      expect(refreshed?.publicationStatus).toBe('expired');
    });
  });

  describe('4. Administrative Verification Queue & Decisions', () => {
    it('allows administrator to verify an opportunity with review notes and evidence', async () => {
      const opp = await Opportunity.create({
        title: 'Unverified Submitter Opportunity',
        slug: 'unverified-submitter-opp',
        organization: { name: 'Tech Startup Ethiopia', isVerified: false },
        opportunityType: 'entry_level_job',
        description: 'Junior frontend engineer role',
        location: 'Addis Ababa',
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        workArrangement: 'remote',
        originalSourceUrl: 'https://techstartup.et/careers',
        applicationUrl: 'https://techstartup.et/apply',
        moderationStatus: 'pending',
        publicationStatus: 'draft',
        verificationStatus: 'PENDING_REVIEW',
        submittedBy: studentUser._id,
        changeHistory: [],
      });

      const res = await request(app)
        .post(`/api/v1/admin/opportunities/${opp._id}/verify`)
        .set(CSRF_HEADER)
        .set('Cookie', adminCookie)
        .send({
          status: 'VERIFIED',
          evidenceNotes: 'Confirmed business license and career portal announcement URL.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('VERIFIED');
      expect(res.body.data.moderationStatus).toBe('approved');
      expect(res.body.data.publicationStatus).toBe('published');
    });

    it('denies non-admin users from verifying opportunities', async () => {
      const opp = await Opportunity.create({
        title: 'Target Opp for Unauthorized Verification',
        slug: 'target-opp-unauthorized',
        organization: { name: 'Target Org', isVerified: false },
        opportunityType: 'internship',
        description: 'Internship role',
        location: 'Hawassa',
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        workArrangement: 'on_site',
        originalSourceUrl: 'https://target.et/apply',
        applicationUrl: 'https://target.et/apply',
        moderationStatus: 'pending',
        publicationStatus: 'draft',
        verificationStatus: 'PENDING_REVIEW',
        submittedBy: adminUser._id,
      });

      const res = await request(app)
        .post(`/api/v1/admin/opportunities/${opp._id}/verify`)
        .set(CSRF_HEADER)
        .set('Cookie', studentCookie)
        .send({
          status: 'VERIFIED',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('5. SSRF Security Safeguards & Safe URL Validation', () => {
    it('blocks internal, loopback, private IPv4, and AWS cloud metadata hosts', () => {
      expect(() => validateSafeUrl('http://localhost:5000/internal')).toThrow(/SSRF Protection/);
      expect(() => validateSafeUrl('http://127.0.0.1:8080/admin')).toThrow(/SSRF Protection/);
      expect(() => validateSafeUrl('http://169.254.169.254/latest/meta-data')).toThrow(/SSRF Protection/);
      expect(() => validateSafeUrl('http://10.0.0.5/secrets')).toThrow(/SSRF Protection/);
      expect(() => validateSafeUrl('http://192.168.1.1/router')).toThrow(/SSRF Protection/);
      expect(() => validateSafeUrl('ftp://example.com/file')).toThrow(/SSRF Protection/);
    });

    it('permits valid public HTTPS institutional sources', () => {
      const parsed = validateSafeUrl('https://www.daad-ethiopia.org/en/feed/');
      expect(parsed.hostname).toBe('www.daad-ethiopia.org');
      expect(parsed.protocol).toBe('https:');
    });
  });

  describe('6. Real Source Parsers (DAAD RSS & MLH Events)', () => {
    it('parses DAAD Ethiopia RSS feed XML and extracts announcements with calculated deadlines', () => {
      const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>DAAD Ethiopia</title>
            <item>
              <title><![CDATA[In-Country / In-Region Scholarship Programme 2026]]></title>
              <link>https://www.daad-ethiopia.org/en/2026/scholarship-call/</link>
              <description><![CDATA[Scholarships for postgraduate studies in Eastern Africa.]]></description>
              <pubDate>Mon, 15 Oct 2026 09:00:00 +0000</pubDate>
            </item>
          </channel>
        </rss>`;

      const announcements = parseDaadRss(sampleXml, testSource);
      expect(announcements.length).toBe(1);
      expect(announcements[0].title).toBe('In-Country / In-Region Scholarship Programme 2026');
      expect(announcements[0].opportunityType).toBe('scholarship');
      expect(announcements[0].originalSourceUrl).toBe('https://www.daad-ethiopia.org/en/2026/scholarship-call/');
      expect(announcements[0].deadline).toBeInstanceOf(Date);
      expect(announcements[0].deadline.getTime()).toBeGreaterThan(Date.now());
    });

    it('parses MLH Inertia JSON data, extracts active events, and filters ended events', () => {
      const sampleHtml = `<!DOCTYPE html>
        <html>
          <head>
            <script data-page="app" type="application/json">
              {
                "props": {
                  "upcomingEvents": [
                    {
                      "name": "Global Hack Week: Cloud 2026",
                      "status": "upcoming",
                      "startsAt": "2026-11-20T10:00:00Z",
                      "endsAt": "2026-11-27T18:00:00Z",
                      "formatType": "digital",
                      "websiteUrl": "https://ghw.mlh.io"
                    },
                    {
                      "name": "Past Hackathon 2025",
                      "status": "ended",
                      "startsAt": "2025-01-01T00:00:00Z",
                      "endsAt": "2025-01-02T00:00:00Z",
                      "websiteUrl": "https://past.mlh.io"
                    }
                  ]
                }
              }
            </script>
          </head>
          <body></body>
        </html>`;

      const announcements = parseMlhEvents(sampleHtml, testSource);
      expect(announcements.length).toBe(1);
      expect(announcements[0].title).toBe('Global Hack Week: Cloud 2026');
      expect(announcements[0].opportunityType).toBe('hackathon');
      expect(announcements[0].location).toContain('Remote / Digital');
      expect(announcements[0].applicationUrl).toBe('https://ghw.mlh.io');
    });
  });
});
