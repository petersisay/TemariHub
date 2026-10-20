import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { ApiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, passwordOrRole?: string, requestedRole?: UserRole) => Promise<void>;
  register: (name: string, email: string, role: UserRole, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Development demo accounts with standard test passwords
const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string; name: string }> = {
  student: {
    email: 'kidus@astu.edu.et',
    password: 'StudentPass2026!',
    name: 'Kidus Hailu',
  },
  submitter: {
    email: 'careers@safaricom.et',
    password: 'SubmitterPass2026!',
    name: 'Bethlehem Tadesse',
  },
  admin: {
    email: 'admin@temarihub.et',
    password: 'AdminPass2026!',
    name: 'TemariHub Lead Administrator',
  },
};

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
    }
  };

  // Development convenience role switcher: attempts real backend login with demo credentials
  const switchDemoRole = async (newRole: UserRole): Promise<void> => {
    // Security gate: Never grant administrator privileges via demo switcher in production
    if (import.meta.env.PROD && newRole === 'admin') {
      console.warn('Admin switching is disabled in production.');
      return;
    }

    const creds = DEMO_CREDENTIALS[newRole];
    try {
      await login(creds.email, creds.password);
    } catch {
      // If server is not reachable (e.g. offline unit test), set memory preview
      setUser({
        id: `demo_${newRole}`,
        name: creds.name,
        email: creds.email,
        role: newRole,
      });
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
        register,
        logout,
        switchDemoRole,
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
