import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Opportunity } from '../models/Opportunity.js';
import { hashPassword } from '../utils/password.js';

export async function seedOpportunitiesData(disconnectOnFinish = false) {
  if (mongoose.connection.readyState !== 1) {
    await connectDatabase(env.MONGODB_URI);
  }

  // Ensure an admin and submitter exist to attribute submissions
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    const adminPassHash = await hashPassword('AdminPass2026!');
    admin = await User.create({
      name: 'TemariHub Lead Administrator',
      email: 'admin@temarihub.et',
      passwordHash: adminPassHash,
      role: 'admin',
      isVerified: true,
    });
  }

  let submitter = await User.findOne({ role: 'submitter' });
  if (!submitter) {
    const submitterPassHash = await hashPassword('SubmitterPass2026!');
    submitter = await User.create({
      name: 'Bethlehem Tadesse',
      email: 'careers@safaricom.et',
      passwordHash: submitterPassHash,
      role: 'submitter',
      isVerified: true,
    });
  }

  let student = await User.findOne({ role: 'student' });
  if (!student) {
    const studentPassHash = await hashPassword('StudentPass2026!');
    student = await User.create({
      name: 'Kidus Hailu',
      email: 'kidus@astu.edu.et',
      passwordHash: studentPassHash,
      role: 'student',
      isVerified: true,
    });
  }

  const existingCount = await Opportunity.countDocuments();
  if (existingCount > 0) {
    console.log(`Database already contains ${existingCount} opportunities. Seeding skipped.`);
    if (disconnectOnFinish) await disconnectDatabase();
    return;
  }

  const sampleOpportunities = [
    {
      title: 'Graduate Software Engineer Intern - Cloud & Fintech',
      slug: 'graduate-software-engineer-intern-safaricom-2026',
      organization: {
        name: 'Safaricom Telecommunications Ethiopia',
        logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&q=80',
        websiteUrl: 'https://safaricom.et',
        isVerified: true,
      },
      opportunityType: 'internship',
      description:
        'Join the Safaricom Ethiopia Engineering Team to build scalable microservices, M-PESA integrations, and real-time telecom billing engines. Mentored by senior cloud architects.',
      eligibleFields: ['Software Engineering', 'Computer Science', 'Computer Engineering'],
      eligibleLevels: ['undergraduate', 'recent_graduate'],
      requiredSkills: ['TypeScript', 'Node.js', 'Docker', 'PostgreSQL', 'REST APIs'],
      location: 'Addis Ababa',
      workArrangement: 'hybrid',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days in future
      isRollingDeadline: false,
      compensation: {
        type: 'stipend',
        amount: 8500,
        currency: 'ETB',
        period: 'monthly',
      },
      originalSourceUrl: 'https://safaricom.et/careers/graduates-2026',
      applicationUrl: 'https://safaricom.et/apply/eng-grad-2026',
      sourceNotes: 'Verified via Safaricom Ethiopia verified corporate portal.',
      moderationStatus: 'approved',
      publicationStatus: 'published',
      reviewedBy: admin._id,
      publicationDate: new Date(),
      lastVerifiedDate: new Date(),
      submittedBy: submitter._id,
    },
    {
      title: 'Junior Machine Learning Researcher - Amharic NLP',
      slug: 'junior-ml-researcher-amharic-nlp-eaii-2026',
      organization: {
        name: 'Ethiopian Artificial Intelligence Institute (EAII)',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
        websiteUrl: 'https://eaiss.gov.et',
        isVerified: true,
      },
      opportunityType: 'fellowship',
      description:
        'Hands-on applied research fellowship contributing to open-source speech-to-text, large language models, and optical character recognition for Ethiopian scripts (Ge’ez/Ethiopic).',
      eligibleFields: ['Computer Science', 'Data Science', 'Electrical Engineering'],
      eligibleLevels: ['undergraduate', 'postgraduate', 'recent_graduate'],
      requiredSkills: ['Python', 'PyTorch', 'Transformers', 'NLP', 'Git'],
      location: 'Addis Ababa',
      workArrangement: 'on_site',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isRollingDeadline: false,
      compensation: {
        type: 'stipend',
        amount: 10000,
        currency: 'ETB',
        period: 'monthly',
      },
      originalSourceUrl: 'https://eaiss.gov.et/research-fellowships',
      applicationUrl: 'https://eaiss.gov.et/apply-nlp',
      sourceNotes: 'Official government research initiative announcement.',
      moderationStatus: 'approved',
      publicationStatus: 'published',
      reviewedBy: admin._id,
      publicationDate: new Date(),
      lastVerifiedDate: new Date(),
      submittedBy: admin._id,
    },
    {
      title: 'National Collegiate Hackathon 2026 — Smart Agriculture & Logistics',
      slug: 'national-collegiate-hackathon-astu-2026',
      organization: {
        name: 'Adama Science & Technology University (ASTU)',
        logoUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=128&q=80',
        websiteUrl: 'https://astu.edu.et',
        isVerified: true,
      },
      opportunityType: 'hackathon',
      description:
        'A 48-hour competitive software & hardware hackathon uniting university student teams across Ethiopia to solve agricultural cold-chain and supply chain optimization.',
      eligibleFields: ['All STEM Disciplines'],
      eligibleLevels: ['undergraduate', 'postgraduate'],
      requiredSkills: ['Problem Solving', 'React', 'Python', 'IoT', 'FastAPI'],
      location: 'Adama',
      workArrangement: 'on_site',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      isRollingDeadline: false,
      compensation: {
        type: 'competitive',
        amount: 250000,
        currency: 'ETB',
        period: 'total',
      },
      originalSourceUrl: 'https://astu.edu.et/hackathons/2026',
      applicationUrl: 'https://astu.edu.et/hackathon/register',
      sourceNotes: 'Verified ASTU ICT Directorate official press release.',
      moderationStatus: 'approved',
      publicationStatus: 'published',
      reviewedBy: admin._id,
      publicationDate: new Date(),
      lastVerifiedDate: new Date(),
      submittedBy: admin._id,
    },
    {
      title: 'Full-Stack Developer Trainee - Gebeya Talent Program',
      slug: 'fullstack-developer-trainee-gebeya-2026',
      organization: {
        name: 'Gebeya Inc.',
        logoUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=128&q=80',
        websiteUrl: 'https://gebeya.com',
        isVerified: true,
      },
      opportunityType: 'training',
      description:
        'Intensive 16-week software engineering accelerator with guaranteed contract matching upon graduation. Covers enterprise Node.js, React, Tailwind, and CI/CD pipelines.',
      eligibleFields: ['Software Engineering', 'Information Technology', 'Computer Science'],
      eligibleLevels: ['undergraduate', 'recent_graduate', 'tvet'],
      requiredSkills: ['JavaScript', 'HTML/CSS', 'Git', 'SQL basics'],
      location: 'Addis Ababa',
      workArrangement: 'hybrid',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isRollingDeadline: true,
      compensation: {
        type: 'unpaid',
      },
      originalSourceUrl: 'https://gebeya.com/training/academy-2026',
      applicationUrl: 'https://gebeya.com/academy/apply',
      sourceNotes: 'Verified partner company accelerator announcement.',
      moderationStatus: 'approved',
      publicationStatus: 'published',
      reviewedBy: admin._id,
      publicationDate: new Date(),
      lastVerifiedDate: new Date(),
      submittedBy: submitter._id,
    },
    {
      title: 'STEM Postgraduate Academic Scholarship',
      slug: 'stem-postgraduate-scholarship-aau-2026',
      organization: {
        name: 'Addis Ababa University Graduate Studies',
        logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&q=80',
        websiteUrl: 'https://aau.edu.et',
        isVerified: true,
      },
      opportunityType: 'scholarship',
      description:
        'Merit-based full tuition fellowship and research grant for top-ranking undergraduate Ethiopian engineering students pursuing MSc degrees in Artificial Intelligence, Cybersecurity, or Embedded Systems.',
      eligibleFields: ['Software Engineering', 'Computer Science', 'Electrical Engineering'],
      eligibleLevels: ['recent_graduate', 'postgraduate'],
      requiredSkills: ['Academic Research', 'Mathematics', 'Algorithms'],
      location: 'Addis Ababa',
      workArrangement: 'on_site',
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isRollingDeadline: false,
      compensation: {
        type: 'stipend',
        amount: 12000,
        currency: 'ETB',
        period: 'monthly',
      },
      originalSourceUrl: 'https://aau.edu.et/scholarships/stem-2026',
      applicationUrl: 'https://aau.edu.et/apply/msc-scholarship',
      sourceNotes: 'Verified via AAU registrar noticeboard.',
      moderationStatus: 'approved',
      publicationStatus: 'published',
      reviewedBy: admin._id,
      publicationDate: new Date(),
      lastVerifiedDate: new Date(),
      submittedBy: admin._id,
    },
    // Pending opportunity for Admin Moderation Queue demonstration
    {
      title: 'Junior Embedded Systems Engineer - Solar Mini-Grids',
      slug: 'junior-embedded-engineer-solar-pending-2026',
      organization: {
        name: 'SunPay Ethiopia Renewable Solutions',
        websiteUrl: 'https://sunpay.et',
        isVerified: false,
      },
      opportunityType: 'entry_level_job',
      description:
        'Design micro-controller firmware and telemetry boards for rural off-grid solar systems across Oromia and Sidama regions. Hands-on testing of C/C++ on STM32.',
      eligibleFields: ['Electrical Engineering', 'Computer Engineering'],
      eligibleLevels: ['undergraduate', 'recent_graduate'],
      requiredSkills: ['C', 'C++', 'Microcontrollers', 'PCB Design', 'MQTT'],
      location: 'Hawassa',
      workArrangement: 'on_site',
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      isRollingDeadline: false,
      compensation: {
        type: 'paid',
        amount: 14000,
        currency: 'ETB',
        period: 'monthly',
      },
      originalSourceUrl: 'https://sunpay.et/careers/embedded-2026',
      applicationUrl: 'https://sunpay.et/apply',
      sourceNotes: 'Submitted by recruiter. Pending admin human verification of source link.',
      moderationStatus: 'pending',
      publicationStatus: 'draft',
      submittedBy: submitter._id,
      lastVerifiedDate: new Date(),
    },
  ];

  await Opportunity.insertMany(sampleOpportunities);
  console.log(`Successfully seeded ${sampleOpportunities.length} opportunities into the database.`);

  if (disconnectOnFinish) {
    await disconnectDatabase();
  }
}

export const seedOpportunities = seedOpportunitiesData;

if (process.argv[1] && process.argv[1].includes('seedOpportunities')) {
  seedOpportunitiesData(true)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
