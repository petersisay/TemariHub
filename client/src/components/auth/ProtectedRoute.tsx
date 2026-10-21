import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectUnauthenticatedTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectUnauthenticatedTo = '/login',
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Verifying session authorization..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectUnauthenticatedTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Route to user's authorized role home
    const roleHome =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'submitter'
        ? '/submission-status'
        : '/dashboard';
    return <Navigate to={roleHome} replace />;
  }

  return <Outlet />;
};
