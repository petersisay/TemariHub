import { StudentProfile } from '../types';
import { ApiClient } from './api';
import { INITIAL_FIXTURE_PROFILE } from './fixtures';

export const profileService = {
  /**
   * Retrieves the authenticated student's academic profile from the backend.
   */
  async getStudentProfile(): Promise<StudentProfile> {
    try {
      const response = await ApiClient.request<StudentProfile>('/profile/me');
      return response.data;
    } catch (err) {
      console.warn('API /profile/me unavailable, local fallback:', err);
      return { ...INITIAL_FIXTURE_PROFILE };
    }
  },

  /**
   * Updates the authenticated student's academic profile.
   */
  async updateStudentProfile(profile: Partial<StudentProfile>): Promise<StudentProfile> {
    try {
      const response = await ApiClient.request<StudentProfile>('/profile/me', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      return response.data;
    } catch (err) {
      console.warn('API /profile/me update failed, local fallback:', err);
      return profile as StudentProfile;
    }
  },
};
