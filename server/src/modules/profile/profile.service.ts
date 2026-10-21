import { StudentProfile, IStudentProfile } from '../../models/StudentProfile.js';
import { User, IUser } from '../../models/User.js';
import { ForbiddenError, NotFoundError, ConflictError, BadRequestError } from '../../utils/errors.js';
import { checkOwnership } from '../../middleware/auth.middleware.js';
import { UpdateProfileInput, UpdatePreferencesInput } from './profile.validation.js';
import { isReservedUsername } from '../../constants/reservedUsernames.js';

export interface UserProfileResponse {
  user: IUser;
  profile?: IStudentProfile | null;
  studentProfile?: IStudentProfile | null;
}

export class ProfileService {
  /**
   * Retrieves profile details for any authenticated user role.
   * If student, includes academic StudentProfile.
   */
  async getProfile(targetUserId: string, requestingUser: IUser): Promise<any> {
    // Cross-user access boundary: users can view their own profile; admins can view any profile
    if (!checkOwnership(targetUserId, requestingUser)) {
      throw new ForbiddenError('Access denied. You cannot view another user\'s private profile.');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('User account not found.');
    }

    const studentProfile = await StudentProfile.findOne({ userId: targetUserId });

    // For backward compatibility with existing tests expecting student profile directly:
    if (targetUser.role === 'student') {
      if (!studentProfile) {
        throw new NotFoundError('Student profile not found.');
      }
      return studentProfile;
    }

    // For non-students (admin, submitter), return user profile object
    return {
      userId: targetUser._id,
      name: targetUser.name,
      username: targetUser.username || '',
      email: targetUser.email,
      role: targetUser.role,
      bio: targetUser.bio || '',
      institution: targetUser.institution || '',
      avatarUrl: targetUser.avatarUrl || '',
    };
  }

  /**
   * Retrieves complete user profile payload including user account and optional student profile.
   */
  async getCompleteProfile(targetUserId: string, requestingUser: IUser): Promise<UserProfileResponse> {
    if (!checkOwnership(targetUserId, requestingUser)) {
      throw new ForbiddenError('Access denied. You cannot view another user\'s private profile.');
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw new NotFoundError('User account not found.');
    }

    const studentProfile = await StudentProfile.findOne({ userId: targetUserId });

    return {
      user,
      profile: studentProfile,
      studentProfile,
    };
  }

  /**
   * Updates profile information for the authenticated user.
   * Role-appropriate: display name, username, bio, and institution work for all roles.
   * Academic fields are updated for student accounts.
   */
  async updateProfile(
    targetUserId: string,
    data: UpdateProfileInput,
    requestingUser: IUser
  ): Promise<any> {
    if (!checkOwnership(targetUserId, requestingUser)) {
      throw new ForbiddenError('Access denied. You cannot modify another user\'s profile.');
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw new NotFoundError('User account not found.');
    }

    // 1. Validate & update unique username if provided
    if (data.username !== undefined && data.username !== null) {
      const normalizedUsername = data.username.toLowerCase().trim();

      if (normalizedUsername !== '') {
        if (isReservedUsername(normalizedUsername)) {
          throw new BadRequestError('This username is reserved and cannot be chosen.');
        }

        const existingWithUsername = await User.findOne({
          username: normalizedUsername,
          _id: { $ne: user._id },
        });

        if (existingWithUsername) {
          throw new ConflictError('This username is already taken. Please choose another.');
        }

        user.username = normalizedUsername;
      } else {
        user.username = undefined;
      }
    }

    // 2. Update display name, bio, and institution
    if (data.name && data.name.trim() !== '') {
      user.name = data.name.trim();
    }
    if (data.bio !== undefined) {
      user.bio = data.bio.trim();
    }
    if (data.institution !== undefined) {
      user.institution = data.institution.trim();
    }

    await user.save();

    // 3. Academic Profile handling for students
    let studentProfile: IStudentProfile | null = null;
    if (user.role === 'student' || data.university || data.fieldOfStudy) {
      const studentData: Record<string, any> = {};
      if (data.university) studentData.university = data.university;
      if (data.customUniversity !== undefined) studentData.customUniversity = data.customUniversity;
      if (data.degreeLevel) studentData.degreeLevel = data.degreeLevel;
      if (data.fieldOfStudy) studentData.fieldOfStudy = data.fieldOfStudy;
      if (data.graduationYear !== undefined) studentData.graduationYear = data.graduationYear;
      if (data.skills) studentData.skills = data.skills;
      if (data.preferredLocations) studentData.preferredLocations = data.preferredLocations;
      if (data.preferredArrangements) studentData.preferredArrangements = data.preferredArrangements;
      if (data.bio !== undefined) studentData.bio = data.bio;
      if (data.githubUrl !== undefined) studentData.githubUrl = data.githubUrl;
      if (data.linkedinUrl !== undefined) studentData.linkedinUrl = data.linkedinUrl;
      if (data.portfolioUrl !== undefined) studentData.portfolioUrl = data.portfolioUrl;

      if (Object.keys(studentData).length > 0) {
        studentProfile = await StudentProfile.findOneAndUpdate(
          { userId: targetUserId },
          { $set: studentData },
          { new: true, upsert: true, runValidators: true }
        );
      } else {
        studentProfile = await StudentProfile.findOne({ userId: targetUserId });
      }
    }

    // If student, return studentProfile for backward test compatibility
    if (user.role === 'student' && studentProfile) {
      return studentProfile;
    }

    return {
      userId: user._id,
      name: user.name,
      username: user.username || '',
      email: user.email,
      role: user.role,
      bio: user.bio || '',
      institution: user.institution || '',
      avatarUrl: user.avatarUrl || '',
      user,
      studentProfile,
    };
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
