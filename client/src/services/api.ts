/**
 * API Client Boundary
 * This module encapsulates all HTTP communication with the /api/v1 REST endpoints.
 * In Phase 1, it provides a clean, typed interface backed by development fixtures
 * while mirroring the exact schema and response envelope defined in docs/API_DOCUMENTATION.md.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
  statusCode: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiClient {
  /**
   * Generic request wrapper with credentials, CSRF headers, and error handling.
   */
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('X-Requested-With', 'XMLHttpRequest');

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Includes HttpOnly session cookie
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || `API Request failed with status ${response.status}`);
      }

      return json as ApiResponse<T>;
    } catch (err: any) {
      // In development fixture mode, this is handled gracefully by services
      throw err;
    }
  }
}
