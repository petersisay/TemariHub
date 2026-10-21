import { StudentProfile, IStudentProfile } from '../../models/StudentProfile.js';
import { User, IUser } from '../../models/User.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { checkOwnership } from '../../middleware/auth.middleware.js';
import { UpdateProfileInput, UpdatePreferencesInput } from './profile.validation.js';

export class ProfileService {
  async getProfile(targetUserId: string, requestingUser: IUser): Promise<IStudentProfile> {
    // Cross-user access boundary: students cannot view other students' private academic profiles
    if (!checkOwnership(targetUserId, requestingUser)) {
      throw new ForbiddenError('Access denied. You cannot view another student\'s private profile.');
    }

    const profile = await StudentProfile.findOne({ userId: targetUserId });
    if (!profile) {
      throw new NotFoundError('Student profile not found.');
    }

    return profile;
  }

  async updateProfile(
    targetUserId: string,
    data: UpdateProfileInput,
    requestingUser: IUser
  ): Promise<IStudentProfile> {
    if (!checkOwnership(targetUserId, requestingUser)) {
      throw new ForbiddenError('Access denied. You cannot modify another student\'s profile.');
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { userId: targetUserId },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );

    return profile;
  }

  async updatePreferences(
    userId: string,
    preferences: UpdatePreferencesInput
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found.');
    }

    user.preferences = {
      deadlineAlerts: preferences.deadlineAlerts ?? user.preferences?.deadlineAlerts ?? true,
      reviewAlerts: preferences.reviewAlerts ?? user.preferences?.reviewAlerts ?? true,
      language: preferences.language ?? user.preferences?.language ?? 'en',
    };

    await user.save();
    return user;
  }
}

export const profileService = new ProfileService();
