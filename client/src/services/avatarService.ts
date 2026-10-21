import { User } from '../types';
import { ApiClient } from './api';

export interface AvatarInfoResponse {
  avatarUrl?: string;
  customAvatarUrl?: string;
  googleAvatarUrl?: string;
  hasCustomAvatar: boolean;
}

export const avatarService = {
  /**
   * Uploads and crops a user profile picture on the backend.
   */
  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await ApiClient.request<{ user: User }>('/profile/avatar', {
      method: 'POST',
      body: formData,
    });

    return response.data.user;
  },

  /**
   * Removes custom user avatar and restores Google avatar or default avatar.
   */
  async removeAvatar(): Promise<User> {
    const response = await ApiClient.request<{ user: User }>('/profile/avatar', {
      method: 'DELETE',
    });

    return response.data.user;
  },

  /**
   * Fetches current avatar information for the logged-in user.
   */
  async getAvatarInfo(): Promise<AvatarInfoResponse> {
    const response = await ApiClient.request<AvatarInfoResponse>('/profile/avatar');
    return response.data;
  },
};
