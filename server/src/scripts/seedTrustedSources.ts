import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { TrustedSource } from '../models/TrustedSource.js';
import { User } from '../models/User.js';

export const INITIAL_TRUSTED_SOURCES = [
  // A. Ethiopian University Opportunities
  {
    name: 'Adama Science & Technology University (ASTU)',
    slug: 'astu-official',
    officialUrl: 'https://www.astu.edu.et/announcement/vacancies-announcements',
    category: 'university' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'permitted_monitoring' as const,
    monitoringConfig: {
      endpointUrl: 'https://www.astu.edu.et/announcement/vacancies-announcements',
      checkIntervalHours: 24,
    },
    monitoringStatus: 'healthy' as const,
    notes: 'Official ASTU vacancies, research fellowships, collegiate hackathons, and laboratory internships.',
  },
  {
    name: 'Addis Ababa University (AAU)',
    slug: 'aau-official',
    officialUrl: 'https://www.aau.edu.et',
    category: 'university' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'manual_review' as const,
    monitoringStatus: 'healthy' as const,
    notes: 'Official AAU graduate studies, research fellowships, and STEM scholarship announcements (requires manual verification as no public RSS/API is provided).',
  },

  // B. Scholarships and Fellowships
  {
    name: 'DAAD Information Centre Addis Ababa',
    slug: 'daad-ethiopia',
    officialUrl: 'https://www.daad-ethiopia.org/en/calls-announcements/',
    category: 'scholarship_portal' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'rss_feed' as const,
    monitoringConfig: {
      feedUrl: 'https://www.daad-ethiopia.org/en/feed/',
      checkIntervalHours: 6,
    },
    monitoringStatus: 'healthy' as const,
    notes: 'Official DAAD Ethiopia scholarship calls, research grants, and regional fellowships for Ethiopian scholars and graduate students.',
  },
  {
    name: 'Mastercard Foundation Scholars Program',
    slug: 'mastercard-foundation-scholars',
    officialUrl: 'https://mastercardfdn.org/en/what-we-do/our-programs/mastercard-foundation-scholars-program/where-to-apply/',
    category: 'scholarship_portal' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'manual_review' as const,
    monitoringStatus: 'healthy' as const,
    notes: 'Decentralized scholarship program administered via partner universities (e.g. University of Gondar); application deadlines and admissions portals vary per partner institution.',
  },

  // C. Software Engineering and Technology
  {
    name: 'Google Summer of Code (GSoC)',
    slug: 'google-summer-of-code',
    officialUrl: 'https://summerofcode.withgoogle.com/',
    category: 'tech_community' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'permitted_monitoring' as const,
    monitoringConfig: {
      endpointUrl: 'https://summerofcode.withgoogle.com/',
      checkIntervalHours: 24,
    },
    monitoringStatus: 'healthy' as const,
    notes: 'Global open-source software development contributor program with stipends; contributor application cycles verified according to official timeline.',
  },
  {
    name: 'Major League Hacking (MLH)',
    slug: 'major-league-hacking',
    officialUrl: 'https://www.mlh.com/',
    category: 'tech_community' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'permitted_monitoring' as const,
    monitoringConfig: {
      endpointUrl: 'https://www.mlh.com/seasons/2026/events',
      checkIntervalHours: 12,
    },
    monitoringStatus: 'healthy' as const,
    notes: 'Official student hackathon league hosting digital, in-person, and global collegiate coding competitions accessible to student developers.',
  },

  // D. International Organizations
  {
    name: 'UNICEF Careers',
    slug: 'unicef-careers',
    officialUrl: 'https://jobs.unicef.org/',
    category: 'international_org' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'manual_review' as const,
    monitoringStatus: 'healthy' as const,
    notes: 'UNICEF student internships, ICT opportunities, and Ethiopia-based early-career vacancies (requires manual review workflow via PageUp career portal).',
  },
  {
    name: 'UNDP Ethiopia',
    slug: 'undp-ethiopia-jobs',
    officialUrl: 'https://www.undp.org/ethiopia/jobs',
    category: 'international_org' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'manual_review' as const,
    monitoringStatus: 'healthy' as const,
    notes: 'United Nations Development Programme early-career and fellowship postings (bot-protected via Cloudflare/Akamai; requires manual review workflow).',
  },

  // E. Ethiopian Technology Companies
  {
    name: 'Safaricom Telecommunications Ethiopia',
    slug: 'safaricom-ethiopia-careers',
    officialUrl: 'https://safaricom.et',
    category: 'corporate' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'manual_review' as const,
    monitoringConfig: {
      endpointUrl: 'https://safaricom.et/careers',
      checkIntervalHours: 24,
    },
    monitoringStatus: 'healthy' as const,
    notes: 'Official Safaricom Ethiopia Engineering Graduate Accelerator & M-PESA internship talent programs.',
  },
  {
    name: 'Ethiopian Artificial Intelligence Institute (EAII)',
    slug: 'eaii-research',
    officialUrl: 'https://www.aii.et',
    category: 'government' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'manual_review' as const,
    monitoringStatus: 'healthy' as const,
    notes: 'Official Ethiopian government AI institute for NLP, computer vision, and robotics graduate research grants.',
  },
  {
    name: 'Ethiopian Airlines Career Portal',
    slug: 'ethiopian-airlines-careers',
    officialUrl: 'https://corporate.ethiopianairlines.com/AboutEthiopian/Careers',
    category: 'corporate' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'manual_review' as const,
    monitoringStatus: 'healthy' as const,
    notes: 'Aviation technology trainee, software engineer, and avionics internship programs.',
  },
  {
    name: 'Gebeya Tech Accelerator',
    slug: 'gebeya-academy',
    officialUrl: 'https://gebeya.com',
    category: 'tech_community' as const,
    verificationStatus: 'approved' as const,
    monitoringMethod: 'manual_review' as const,
    monitoringStatus: 'healthy' as const,
    notes: 'Verified software talent accelerator partnering with Ethiopian tech hubs.',
  },
];

export async function seedTrustedSources(disconnectOnFinish = false) {
  if (mongoose.connection.readyState !== 1) {
    await connectDatabase(env.MONGODB_URI);
  }

  const admin = await User.findOne({ role: 'admin' });

  for (const src of INITIAL_TRUSTED_SOURCES) {
    const existing = await TrustedSource.findOne({ slug: src.slug });
    if (!existing) {
      await TrustedSource.create({
        ...src,
        approvedBy: admin?._id,
        lastSuccessfulCheck: new Date(),
        opportunitiesDiscoveredCount: 0,
        failureCount: 0,
      });
      console.log(`[TrustedSource Seed] Seeded new source: ${src.name}`);
    } else {
      // Non-destructive update: refresh official URLs, methods, configs, notes while preserving ID and stats
      existing.name = src.name;
      existing.officialUrl = src.officialUrl;
      existing.monitoringMethod = src.monitoringMethod;
      existing.category = src.category;
      existing.notes = src.notes;
      if (src.monitoringConfig) {
        existing.monitoringConfig = src.monitoringConfig;
      }
      await existing.save();
      console.log(`[TrustedSource Seed] Refreshed source config: ${src.name}`);
    }
  }

  if (disconnectOnFinish) {
    await disconnectDatabase();
  }
}

if (process.argv[1] && process.argv[1].includes('seedTrustedSources')) {
  seedTrustedSources(true)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding trusted sources failed:', err);
      process.exit(1);
    });
}
