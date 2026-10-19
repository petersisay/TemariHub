import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { hashPassword } from '../utils/password.js';

export interface ProvisionAdminOptions {
  email?: string;
  password?: string;
  name?: string;
  mongoUri?: string;
  disconnectOnFinish?: boolean;
}

export interface ProvisionAdminResult {
  status: 'created' | 'already_exists';
  userId: string;
  email: string;
  role: 'admin';
}

/**
 * Provisions the initial administrator account.
 *
 * Rules:
 * 1. Requires valid email and password (minimum 8 characters).
 * 2. Uses the real User schema `name` field.
 * 3. If the account already exists as 'admin', exits safely and idempotently without creating duplicates.
 * 4. If the account already exists as 'student' or 'submitter', strictly REFUSES automatic promotion.
 *    Automatic privilege escalation of existing standard accounts is prohibited.
 * 5. Records successful administrator creation in AuditLog (targetType: 'user').
 * 6. Never logs passwords or sensitive credentials.
 */
export async function provisionAdmin(options: ProvisionAdminOptions = {}): Promise<ProvisionAdminResult> {
  const email = (options.email ?? process.env.INITIAL_ADMIN_EMAIL)?.trim();
  const password = options.password ?? process.env.INITIAL_ADMIN_PASSWORD;
  const name = (options.name ?? process.env.INITIAL_ADMIN_NAME)?.trim() || 'TemariHub Administrator';
  const mongoUri = options.mongoUri || env.MONGODB_URI;
  const disconnectOnFinish = options.disconnectOnFinish ?? false;

  if (!email || !password) {
    throw new Error('INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required.');
  }

  if (password.length < 8) {
    throw new Error('Admin password must be at least 8 characters long.');
  }

  let connectedHere = false;
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDatabase(mongoUri);
      connectedHere = true;
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        return {
          status: 'already_exists',
          userId: existingUser._id.toString(),
          email: existingUser.email,
          role: 'admin',
        };
      }

      // Security requirement: Never automatically escalate non-admin roles to administrator
      throw new Error(
        `Refusing to automatically promote existing user '${normalizedEmail}' with role '${existingUser.role}' to administrator. ` +
        `Role escalation requires an explicit, separately authorized administrative procedure.`
      );
    }

    const passwordHash = await hashPassword(password);
    const newAdmin = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: 'admin',
      isVerified: true,
    });

    await AuditLog.create({
      actorId: newAdmin._id,
      action: 'admin_provisioned',
      targetType: 'user',
      targetId: newAdmin._id,
      ipAddress: '127.0.0.1',
      userAgent: 'CLI bootstrap script',
      metadata: {
        email: normalizedEmail,
        action: 'initial_administrator_provisioning',
      },
      timestamp: new Date(),
    });

    return {
      status: 'created',
      userId: newAdmin._id.toString(),
      email: newAdmin.email,
      role: 'admin',
    };
  } finally {
    if (disconnectOnFinish && connectedHere) {
      await disconnectDatabase();
    }
  }
}

// CLI Execution entrypoint
const currentFilePath = fileURLToPath(import.meta.url);
const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isCliExecution = Boolean(
  invokedFilePath &&
  (invokedFilePath === currentFilePath ||
   invokedFilePath.endsWith('seedAdmin.ts') ||
   invokedFilePath.endsWith('seedAdmin.js'))
);

if (isCliExecution) {
  provisionAdmin({ disconnectOnFinish: true })
    .then((result) => {
      if (result.status === 'already_exists') {
        console.log(`Administrator '${result.email}' already exists. No duplicate created.`);
      } else {
        console.log(`Successfully provisioned initial administrator '${result.email}'.`);
      }
      process.exit(0);
    })
    .catch(async (error: any) => {
      console.error(`Administrator provisioning error: ${error.message}`);
      try {
        await disconnectDatabase();
      } catch {
        // Ignore disconnect failure on exit
      }
      process.exit(1);
    });
}
