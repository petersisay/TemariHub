import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { ApiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, passwordOrRole?: string, requestedRole?: UserRole) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<{ user: User; isNewUser: boolean }>;
  register: (name: string, email: string, role: UserRole, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (newRole: UserRole) => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check existing session on mount via GET /api/v1/auth/me
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      try {
        const res = await ApiClient.request<{ user: User }>('/auth/me');
        if (isMounted && res.data?.user) {
          setUser(res.data.user);
        }
      } catch {
        // No active session or unauthenticated
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    email: string,
    passwordOrRole?: string,
    _requestedRole?: UserRole
  ): Promise<void> => {
    setIsLoading(true);
    try {
      let password = 'Password123!';
      if (
        passwordOrRole &&
        passwordOrRole !== 'student' &&
        passwordOrRole !== 'submitter' &&
        passwordOrRole !== 'admin'
      ) {
        password = passwordOrRole;
      }

      const res = await ApiClient.request<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Authentication login failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string): Promise<{ user: User; isNewUser: boolean }> => {
    setIsLoading(true);
    try {
      const res = await ApiClient.request<{ user: User; isNewUser: boolean }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });

      if (res.data?.user) {
        setUser(res.data.user);
      }
      return { user: res.data.user, isNewUser: Boolean(res.data.isNewUser) };
    } catch (err) {
      console.error('Google authentication failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    role: UserRole,
    password?: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await ApiClient.request<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: name,
          email,
          role,
          password: password || 'Password123!',
        }),
      });

      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await ApiClient.request('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout API notification error:', err);
    } finally {
      setUser(null);
      setIsLoading(false);
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Ignore storage access errors
      }
      // Force navigation to public landing page and clear in-memory history
      window.location.href = '/';
    }
  };

  // Role switching is strictly disabled; genuine authentication only
  const switchDemoRole = async (_newRole: UserRole): Promise<void> => {
    // No-op for security and real data integrity
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedFields };
      if (updatedFields.hasCustomAvatar === false) {
        next.hasCustomAvatar = false;
        next.customAvatarUrl = '';
        next.avatarUrl = updatedFields.avatarUrl || prev.googleAvatarUrl || '';
      }
      return next;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await ApiClient.request<{ user: User }>('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : 'student',
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        switchDemoRole,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
