import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Opportunity } from '../models/Opportunity.js';
import { StudentProfile } from '../models/StudentProfile.js';

interface AuditReport {
  timestamp: string;
  environment: string;
  databaseUri: string;
  databaseName: string;
  dryRun: boolean;
  collections: {
    sessions: {
      totalDocuments: number;
      indexes: any[];
      obsoleteIndexFound: boolean;
      obsoleteIndexName?: string;
      actionTaken?: string;
    };
    users: {
      totalUsers: number;
      adminAccount: {
        email: string;
        exists: boolean;
        currentRole?: string;
        isGoogleLinked?: boolean;
        googleId?: string;
        reconciled?: boolean;
      };
      submitterAccount: {
        email: string;
        exists: boolean;
        currentRole?: string;
        isGoogleLinked?: boolean;
        googleId?: string;
        reconciled?: boolean;
      };
      duplicateEmails: string[];
      duplicateGoogleIds: string[];
      usernamesCount: number;
    };
    opportunities: {
      totalOpportunities: number;
      verifiedCount: number;
      publishedCount: number;
    };
    studentProfiles: {
      totalProfiles: number;
    };
  };
  recommendations: string[];
  rollbackInstructions: string[];
}

export async function runDatabaseAudit(applyChanges: boolean = false): Promise<AuditReport> {
  const conn = await mongoose.connect(env.MONGODB_URI);
  const db = conn.connection.db;

  if (!db) {
    throw new Error('Could not establish connection to MongoDB database.');
  }

  const dbName = db.databaseName;
  const isDryRun = !applyChanges;

  console.log(`\n======================================================`);
  console.log(` TEMARIHUB DATABASE AUDIT & INTEGRITY CHECK`);
  console.log(` Mode: ${isDryRun ? 'DRY-RUN (Inspection Only)' : 'APPLY (Live Migration)'}`);
  console.log(` Database: ${dbName}`);
  console.log(`======================================================\n`);

  const recommendations: string[] = [];
  const rollbackInstructions: string[] = [];

  // 1. Audit Sessions Collection
  let sessionsCount = 0;
  let sessionIndexes: any[] = [];
  let obsoleteIndexFound = false;
  let obsoleteIndexName = '';
  let sessionActionTaken = 'None';

  const collections = await db.listCollections().toArray();
  const sessionColExists = collections.some((c) => c.name === 'sessions');

  if (sessionColExists) {
    const sessionCol = db.collection('sessions');
    sessionsCount = await sessionCol.countDocuments();
    sessionIndexes = await sessionCol.indexes();

    const targetIdx = sessionIndexes.find((idx) => idx.name === 'sessionTokenHash_1');
    if (targetIdx) {
      obsoleteIndexFound = true;
      obsoleteIndexName = 'sessionTokenHash_1';

      recommendations.push(
        `Obsolete index 'sessionTokenHash_1' detected on collection '${dbName}.sessions'. ` +
          `connect-mongo does not populate this field, causing duplicate null keys on subsequent logins. ` +
          `Index must be dropped.`
      );

      rollbackInstructions.push(
        `To recreate if ever needed: db.collection('sessions').createIndex({ sessionTokenHash: 1 }, { unique: true, sparse: true })`
      );

      if (applyChanges) {
        console.log(`[ACTION] Dropping obsolete unique index 'sessionTokenHash_1' on 'sessions'...`);
        await sessionCol.dropIndex('sessionTokenHash_1');
        sessionActionTaken = 'Dropped index sessionTokenHash_1';
        console.log(`[SUCCESS] Obsolete index 'sessionTokenHash_1' successfully dropped.`);
      } else {
        sessionActionTaken = 'Identified for removal (requires --apply to execute)';
      }
    }
  }

  // 2. Audit Users Collection
  const totalUsers = await User.countDocuments();
  const normalizedAdminEmail = env.ADMIN_EMAIL.toLowerCase().trim();
  const normalizedSubmitterEmail = env.SUBMITTER_EMAIL.toLowerCase().trim();

  const adminDoc = await User.findOne({ email: normalizedAdminEmail });
  const submitterDoc = await User.findOne({ email: normalizedSubmitterEmail });

  let adminReconciled = false;
  let submitterReconciled = false;

  if (adminDoc) {
    if (adminDoc.role !== 'admin') {
      recommendations.push(
        `Admin account '${adminDoc.email}' currently has role '${adminDoc.role}'. Needs reconciliation to 'admin'.`
      );
      if (applyChanges) {
        adminDoc.role = 'admin';
        await adminDoc.save();
        adminReconciled = true;
        console.log(`[ACTION] Reconciled role for '${adminDoc.email}' to 'admin'.`);
      }
    }
  } else {
    recommendations.push(
      `Designated admin email '${normalizedAdminEmail}' does not yet exist. Will be auto-provisioned as 'admin' upon verified Google sign-in.`
    );
  }

  if (submitterDoc) {
    if (submitterDoc.role !== 'submitter') {
      recommendations.push(
        `Submitter account '${submitterDoc.email}' currently has role '${submitterDoc.role}'. Needs reconciliation to 'submitter'.`
      );
      if (applyChanges) {
        submitterDoc.role = 'submitter';
        await submitterDoc.save();
        submitterReconciled = true;
        console.log(`[ACTION] Reconciled role for '${submitterDoc.email}' to 'submitter'.`);
      }
    }
  } else {
    recommendations.push(
      `Designated submitter email '${normalizedSubmitterEmail}' does not yet exist. Will be auto-provisioned as 'submitter' upon verified Google sign-in.`
    );
  }

  // Check duplicate emails
  const emailAgg = await User.aggregate([
    { $group: { _id: '$email', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  const duplicateEmails = emailAgg.map((e) => e._id);

  // Check duplicate googleIds
  const googleAgg = await User.aggregate([
    { $match: { googleId: { $exists: true, $ne: null } } },
    { $group: { _id: '$googleId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  const duplicateGoogleIds = googleAgg.map((g) => g._id);

  const usernamesCount = await User.countDocuments({ username: { $exists: true, $ne: '' } });

  // 3. Audit Opportunities
  const totalOpportunities = await Opportunity.countDocuments();
  const verifiedCount = await Opportunity.countDocuments({ verificationStatus: 'VERIFIED' });
  const publishedCount = await Opportunity.countDocuments({ publicationStatus: 'published' });

  // 4. Audit Profiles
  const totalProfiles = await StudentProfile.countDocuments();

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    databaseUri: env.MONGODB_URI.replace(/:\/\/.*@/, '://***:***@'),
    databaseName: dbName,
    dryRun: isDryRun,
    collections: {
      sessions: {
        totalDocuments: sessionsCount,
        indexes: sessionIndexes.map((i) => ({ name: i.name, key: i.key, unique: Boolean(i.unique) })),
        obsoleteIndexFound,
        obsoleteIndexName,
        actionTaken: sessionActionTaken,
      },
      users: {
        totalUsers,
        adminAccount: {
          email: normalizedAdminEmail,
          exists: Boolean(adminDoc),
          currentRole: adminDoc?.role,
          isGoogleLinked: Boolean(adminDoc?.googleId),
          googleId: adminDoc?.googleId ? `${adminDoc.googleId.slice(0, 6)}...` : undefined,
          reconciled: adminReconciled,
        },
        submitterAccount: {
          email: normalizedSubmitterEmail,
          exists: Boolean(submitterDoc),
          currentRole: submitterDoc?.role,
          isGoogleLinked: Boolean(submitterDoc?.googleId),
          googleId: submitterDoc?.googleId ? `${submitterDoc.googleId.slice(0, 6)}...` : undefined,
          reconciled: submitterReconciled,
        },
        duplicateEmails,
        duplicateGoogleIds,
        usernamesCount,
      },
      opportunities: {
        totalOpportunities,
        verifiedCount,
        publishedCount,
      },
      studentProfiles: {
        totalProfiles,
      },
    },
    recommendations,
    rollbackInstructions,
  };

  console.log(`\nAudit Findings Summary:`);
  console.log(`- Sessions Count: ${sessionsCount}`);
  console.log(`- Obsolete 'sessionTokenHash_1' index on sessions: ${obsoleteIndexFound ? 'DETECTED ⚠️' : 'CLEAN ✅'}`);
  console.log(`- Admin Account (${normalizedAdminEmail}): ${adminDoc ? `Role: ${adminDoc.role}` : 'Pending first login'}`);
  console.log(`- Submitter Account (${normalizedSubmitterEmail}): ${submitterDoc ? `Role: ${submitterDoc.role}` : 'Pending first login'}`);
  console.log(`- Duplicate Emails: ${duplicateEmails.length}`);
  console.log(`- Duplicate Google IDs: ${duplicateGoogleIds.length}`);
  console.log(`- Verified Opportunities in Feed: ${verifiedCount}`);
  console.log(`------------------------------------------------------\n`);

  await mongoose.disconnect();
  return report;
}

// Allow direct execution from CLI
if (process.argv[1]?.includes('databaseAuditAndMigration')) {
  const isApply = process.argv.includes('--apply');
  runDatabaseAudit(isApply)
    .then((report) => {
      console.log('Complete Audit Report (JSON):');
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database audit failed:', err);
      process.exit(1);
    });
}
