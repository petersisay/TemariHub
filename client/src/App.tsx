import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from './context/I18nContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { OpportunityDetailPage } from './pages/OpportunityDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { SavedOpportunitiesPage } from './pages/SavedOpportunitiesPage';
import { ApplicationTrackerPage } from './pages/ApplicationTrackerPage';
import { SubmitOpportunityPage } from './pages/SubmitOpportunityPage';
import { SubmissionStatusPage } from './pages/SubmissionStatusPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ModerationQueuePage } from './pages/ModerationQueuePage';
import { ReportsManagementPage } from './pages/ReportsManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                {/* Public Discovery Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/opportunities" element={<OpportunitiesPage />} />
                <Route path="/opportunities/:idOrSlug" element={<OpportunityDetailPage />} />

                {/* Authentication Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Student Workspace Routes - Strictly for STUDENT role */}
                <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                  <Route path="/dashboard" element={<StudentDashboardPage />} />
                  <Route path="/profile" element={<StudentProfilePage />} />
                  <Route path="/saved" element={<SavedOpportunitiesPage />} />
                  <Route path="/tracker" element={<ApplicationTrackerPage />} />
                </Route>

                {/* Submitter Routes - Strictly for SUBMITTER and ADMIN roles */}
                <Route element={<ProtectedRoute allowedRoles={['submitter', 'admin']} />}>
                  <Route path="/submit" element={<SubmitOpportunityPage />} />
                  <Route path="/submission-status" element={<SubmissionStatusPage />} />
                </Route>

                {/* Administrative Routes - Strictly for ADMINISTRATOR role */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/moderation" element={<ModerationQueuePage />} />
                  <Route path="/reports" element={<ReportsManagementPage />} />
                </Route>

                {/* Settings & Profile - For any authenticated user */}
                <Route element={<ProtectedRoute allowedRoles={['student', 'submitter', 'admin']} />}>
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

export default App;
