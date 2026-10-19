import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Shield } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'submitter'>('student');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await register(name, email, role, password);
      if (role === 'submitter') {
        navigate('/submit');
      } else {
        navigate('/profile');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-200 shadow-2xs">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('auth.registerTitle')}</h1>
        <p className="text-xs text-slate-500">{t('auth.registerSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('auth.fullName')}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kidus Hailu"
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('auth.email')}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. kidus@astu.edu.et"
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('auth.role')}
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'student' | 'submitter')}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="student">{t('auth.roleStudent')}</option>
            <option value="submitter">{t('auth.roleSubmitter')}</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Admin privileges cannot be self-assigned through public registration.</span>
          </p>
        </div>

        <Button variant="primary" size="md" type="submit" isLoading={isLoading} className="w-full">
          {t('auth.registerBtn')}
        </Button>

        <div className="text-center pt-2 text-xs text-slate-500">
          <span>{t('auth.haveAccount')} </span>
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            {t('nav.login')}
          </Link>
        </div>
      </form>
    </div>
  );
};
