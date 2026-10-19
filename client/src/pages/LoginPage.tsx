import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('kidus.hailu@astu.edu.et');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState<UserRole>('student');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await login(email, password, role);
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'submitter') {
        navigate('/submission-status');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleDemoSignIn = async (demoRole: UserRole) => {
    setErrorMessage(null);
    const demoAccounts: Record<UserRole, { email: string; pass: string }> = {
      student: { email: 'kidus@astu.edu.et', pass: 'Password123!' },
      submitter: { email: 'careers@safaricom.et', pass: 'Password123!' },
      admin: { email: 'admin@temarihub.et', pass: 'Password123!' },
    };

    const cred = demoAccounts[demoRole];
    setEmail(cred.email);
    setPassword(cred.pass);
    setRole(demoRole);

    try {
      await login(cred.email, cred.pass, demoRole);
      if (demoRole === 'admin') navigate('/admin');
      else if (demoRole === 'submitter') navigate('/submission-status');
      else navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Ensure backend server is running.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-200 shadow-2xs">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('auth.loginTitle')}</h1>
        <p className="text-xs text-slate-500">{t('auth.loginSubtitle')}</p>
      </div>

      {/* Demo Quick-Sign-In Pills */}
      <div className="p-4 bg-navy-950 rounded-2xl border border-navy-800 text-white space-y-3 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          <Sparkles className="w-4 h-4" />
          <span>One-Click Role Switcher (Phase 1 Evaluation)</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleDemoSignIn('student')}
            className="px-2 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-xs font-semibold text-slate-200 border border-navy-700 transition-colors"
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => handleDemoSignIn('submitter')}
            className="px-2 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-xs font-semibold text-slate-200 border border-navy-700 transition-colors"
          >
            Submitter
          </button>
          <button
            type="button"
            onClick={() => handleDemoSignIn('admin')}
            className="px-2 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-xs font-semibold text-slate-200 border border-navy-700 transition-colors"
          >
            Admin
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('auth.email')}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('auth.password')}
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Sign In Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
          >
            <option value="student">Student / Recent Graduate</option>
            <option value="submitter">Opportunity Submitter</option>
            <option value="admin">Platform Administrator</option>
          </select>
        </div>

        <Button variant="primary" size="md" type="submit" isLoading={isLoading} className="w-full">
          {t('auth.loginBtn')}
        </Button>

        <div className="text-center pt-2 text-xs text-slate-500">
          <span>{t('auth.noAccount')} </span>
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            {t('nav.register')}
          </Link>
        </div>
      </form>
    </div>
  );
};
