import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { env } from '../../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../../utils/errors.js';
import { User, IUser, UserRole } from '../../models/User.js';
import { StudentProfile } from '../../models/StudentProfile.js';
import { AuditLog } from '../../models/AuditLog.js';

let oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Allows test suites to inject a mocked OAuth2Client
 */
export function setGoogleOAuthClientForTesting(client: any): void {
  oauthClient = client;
}

export function resetGoogleOAuthClient(): void {
  oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
}

/**
 * Checks university email domain policy when REQUIRE_UNIVERSITY_EMAIL is true.
 * Configured admin and submitter accounts are strictly exempt.
 */
export function isEmailAllowedByUniversityPolicy(email: string): boolean {
  if (!env.REQUIRE_UNIVERSITY_EMAIL) {
    return true;
  }

  const normalized = email.toLowerCase().trim();
  // Administrative and submitter accounts are always permitted
  if (
    normalized === env.ADMIN_EMAIL.toLowerCase().trim() ||
    normalized === env.SUBMITTER_EMAIL.toLowerCase().trim()
  ) {
    return true;
  }

  if (!env.UNIVERSITY_EMAIL_DOMAINS || env.UNIVERSITY_EMAIL_DOMAINS.trim() === '') {
    return true;
  }

  const domain = normalized.split('@')[1];
  if (!domain) {
    return false;
  }

  const allowedDomains = env.UNIVERSITY_EMAIL_DOMAINS.toLowerCase()
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);

  return allowedDomains.includes(domain);
}

/**
 * Determines user role strictly based on verified Google email configuration.
 */
export function determineRoleForVerifiedEmail(email: string): UserRole {
  const normalized = email.toLowerCase().trim();
  if (normalized === env.ADMIN_EMAIL.toLowerCase().trim()) {
    return 'admin';
  }
  if (normalized === env.SUBMITTER_EMAIL.toLowerCase().trim()) {
    return 'submitter';
  }
  return 'student';
}

export interface GoogleVerifiedPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

/**
 * Verifies a Google ID token using Google's official library.
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleVerifiedPayload> {
  if (!idToken || typeof idToken !== 'string') {
    throw new UnauthorizedError('Google ID token is required.');
  }

  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload: TokenPayload | undefined = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedError('Invalid Google ID token payload.');
    }

    if (!payload.sub) {
      throw new UnauthorizedError('Google ID token missing subject identifier.');
    }

    if (!payload.email) {
      throw new UnauthorizedError('Google ID token missing email claim.');
    }

    if (!payload.email_verified) {
      throw new UnauthorizedError('Google account email is not verified.');
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase().trim(),
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
      emailVerified: true,
    };
  } catch (err: any) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      throw err;
    }
    throw new UnauthorizedError(`Google token verification failed: ${err.message}`);
  }
}

export interface AuthenticateGoogleResult {
  user: IUser;
  isNewUser: boolean;
}

/**
 * Authenticates or provisions a user from verified Google payload.
 * Enforces university domain policies, idempotent linking, and privileged role assignment.
 */
export async function authenticateWithGooglePayload(
  payload: GoogleVerifiedPayload,
  clientIp?: string
): Promise<AuthenticateGoogleResult> {
  const normalizedEmail = payload.email.toLowerCase().trim();

  // Enforce optional university email restriction
  if (!isEmailAllowedByUniversityPolicy(normalizedEmail)) {
    throw new ForbiddenError(
      'Registration restricted: Your email domain is not in the approved university list.'
    );
  }

  const targetRole = determineRoleForVerifiedEmail(normalizedEmail);

  // 1. Check if user already exists by Google Subject ID
  let user = await User.findOne({ googleId: payload.sub });

  if (user) {
    // Repeat sign-in: update Google avatar or sync privileged role if email matches admin/submitter
    let updated = false;
    if (payload.picture) {
      if (user.googleAvatarUrl !== payload.picture) {
        user.googleAvatarUrl = payload.picture;
        updated = true;
      }
      // Never overwrite a user's custom TemariHub profile picture
      if (!user.hasCustomAvatar && user.avatarUrl !== payload.picture) {
        user.avatarUrl = payload.picture;
        updated = true;
      }
    }

    if (user.role !== targetRole) {
      const oldRole = user.role;
      user.role = targetRole;
      updated = true;

      await AuditLog.create({
        actorId: user._id,
        targetId: user._id,
        targetType: 'user',
        action: targetRole === 'admin' ? 'admin_provisioned' : 'user_role_change',
        metadata: {
          email: user.email,
          previousRole: oldRole,
          newRole: targetRole,
          reason: 'Google identity verification matched configured privileged email',
          ip: clientIp,
        },
      });
    }

    if (updated) {
      await user.save();
    }

    return { user, isNewUser: false };
  }

  // 2. Check if an account already exists with this verified email
  const existingByEmail = await User.findOne({ email: normalizedEmail });

  if (existingByEmail) {
    // Secure account linking: since Google confirmed ownership of this email, link identities
    const oldRole = existingByEmail.role;
    existingByEmail.googleId = payload.sub;
    existingByEmail.authProvider = 'google';
    existingByEmail.isVerified = true;
    if (payload.picture) {
      existingByEmail.googleAvatarUrl = payload.picture;
      if (!existingByEmail.hasCustomAvatar && !existingByEmail.avatarUrl) {
        existingByEmail.avatarUrl = payload.picture;
      }
    }

    if (existingByEmail.role !== targetRole) {
      existingByEmail.role = targetRole;
    }

    await existingByEmail.save();

    await AuditLog.create({
      actorId: existingByEmail._id,
      targetId: existingByEmail._id,
      targetType: 'user',
      action: 'account_linked',
      metadata: {
        email: existingByEmail.email,
        authProvider: 'google',
        role: existingByEmail.role,
        previousRole: oldRole,
        ip: clientIp,
      },
    });

    return { user: existingByEmail, isNewUser: false };
  }

  // 3. Brand new user registration
  user = await User.create({
    name: payload.name,
    email: normalizedEmail,
    googleId: payload.sub,
    authProvider: 'google',
    role: targetRole,
    isVerified: true,
    avatarUrl: payload.picture,
    googleAvatarUrl: payload.picture,
    hasCustomAvatar: false,
  });

  // If student, create default student profile
  if (targetRole === 'student') {
    await StudentProfile.create({
      userId: user._id,
      university: 'Adama Science and Technology University (ASTU)',
      degreeLevel: 'undergraduate',
      fieldOfStudy: 'Software Engineering',
      graduationYear: new Date().getFullYear() + 2,
      skills: [],
    });
  }

  await AuditLog.create({
    actorId: user._id,
    targetId: user._id,
    targetType: 'user',
    action: targetRole === 'admin' ? 'admin_provisioned' : 'user_registered',
    metadata: {
      email: user.email,
      role: targetRole,
      authProvider: 'google',
      ip: clientIp,
    },
  });

  return { user, isNewUser: true };
}
