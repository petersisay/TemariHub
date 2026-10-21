import { StudentProfile, User } from '../types';
import { ApiClient } from './api';

export interface CompleteProfileResponse {
  user: User;
  profile?: StudentProfile | null;
  studentProfile?: StudentProfile | null;
}

export interface UpdateProfilePayload extends Partial<StudentProfile> {
  name?: string;
  username?: string;
  bio?: string;
  institution?: string;
}

export const profileService = {
  /**
   * Retrieves the authenticated user's complete profile.
   */
  async getProfile(): Promise<CompleteProfileResponse> {
    const response = await ApiClient.request<{
      user: User;
      profile?: StudentProfile | null;
      studentProfile?: StudentProfile | null;
    }>('/profile/me');

    return {
      user: response.data.user,
      profile: response.data.profile,
      studentProfile: response.data.studentProfile,
    };
  },

  /**
   * Updates the authenticated user's profile and returns updated user and profile.
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<{
    user: User;
    profile?: any;
    studentProfile?: StudentProfile | null;
  }> {
    const response = await ApiClient.request<{
      user: User;
      profile?: any;
      studentProfile?: StudentProfile | null;
    }>('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return response.data;
  },

  /**
   * Backward-compatible helper for StudentProfilePage
   */
  async getStudentProfile(): Promise<StudentProfile> {
    try {
      const response = await ApiClient.request<{ profile: StudentProfile; studentProfile: StudentProfile }>('/profile/me');
      return response.data.studentProfile || response.data.profile || ({} as StudentProfile);
    } catch (err) {
      console.warn('API /profile/me request error:', err);
      return {} as StudentProfile;
    }
  },

  /**
   * Backward-compatible helper for StudentProfilePage
   */
  async updateStudentProfile(profile: Partial<StudentProfile>): Promise<StudentProfile> {
    try {
      const response = await ApiClient.request<{ profile: StudentProfile; studentProfile: StudentProfile }>('/profile/me', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      return response.data.studentProfile || response.data.profile || (profile as StudentProfile);
    } catch (err) {
      console.warn('API /profile/me update failed, local fallback:', err);
      return profile as StudentProfile;
    }
  },
};
