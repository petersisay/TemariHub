import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Globe, Bell, CheckCircle2, AlertCircle, ArrowRight, LayoutDashboard, Loader2 } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { ApiClient } from '../services/api';
import { User } from '../types';
import { Button } from '../components/common/Button';
import { ProfilePictureEditor } from '../components/profile/ProfilePictureEditor';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.preferences) {
      if (typeof user.preferences.deadlineAlerts === 'boolean') {
        setDeadlineAlerts(user.preferences.deadlineAlerts);
      }
      if (typeof user.preferences.reviewAlerts === 'boolean') {
        setReviewAlerts(user.preferences.reviewAlerts);
      }
      if (user.preferences.language) {
        setLanguage(user.preferences.language);
      }
    } else {
      try {
        const stored = localStorage.getItem('temarihub_preferences');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed.deadlineAlerts === 'boolean') setDeadlineAlerts(parsed.deadlineAlerts);
          if (typeof parsed.reviewAlerts === 'boolean') setReviewAlerts(parsed.reviewAlerts);
          if (parsed.language) setLanguage(parsed.language);
        }
      } catch {
        // ignore
      }
    }
  }, [user, setLanguage]);

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'submitter') return '/submission-status';
    return '/dashboard';
  };

  const savePreferencesToServer = async (): Promise<boolean> => {
    setIsSaving(true);
    setSaveError(null);
    setSavedSuccess(false);

    try {
      const res = await ApiClient.request<{ user: User }>('/profile/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          deadlineAlerts,
          reviewAlerts,
          language,
        }),
      });

      if (res.data?.user) {
        updateUser(res.data.user);
      } else {
        updateUser({
          preferences: { deadlineAlerts, reviewAlerts, language },
        });
      }

      try {
        localStorage.setItem(
          'temarihub_preferences',
          JSON.stringify({ deadlineAlerts, reviewAlerts, language })
        );
      } catch {
        // ignore
      }

      setSavedSuccess(true);
      return true;
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save preferences to server. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePreferencesToServer();
  };

  const handleSaveAndGo = async (e: React.MouseEvent) => {
    e.preventDefault();
    const ok = await savePreferencesToServer();
    if (ok) {
      navigate(getDashboardPath());
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between gap-4 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Preferences saved successfully to your account.</span>
          </div>
          <Link to={getDashboardPath()}>
            <Button variant="outline" size="sm" className="bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100/60">
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-brand-600" />
            <span>{t('nav.settings')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Customize your profile picture, language, and platform preferences.
          </p>
        </div>

        <Link to={getDashboardPath()}>
          <Button variant="outline" size="sm" icon={<LayoutDashboard className="w-4 h-4 text-brand-600" />}>
            Dashboard
          </Button>
        </Link>
      </div>

      {/* Profile Picture Management (All Roles) */}
      <ProfilePictureEditor />

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Language Selection */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Globe className="w-4 h-4 text-brand-600" />
            <h3>Language Preference / የቋንቋ ምርጫ</h3>
          </div>
          <p className="text-xs text-slate-500">
            Choose the language for application navigation, forms, and tracking dashboards.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-sm pt-2">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-3 rounded-xl border text-left transition-all ${
                language === 'en'
                  ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-sm">English</div>
              <div className="text-[10px] text-slate-500 font-normal">Primary Language</div>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('am')}
              className={`p-3 rounded-xl border text-left transition-all font-ethiopic ${
                language === 'am'
                  ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-sm">አማርኛ (Amharic)</div>
              <div className="text-[10px] text-slate-500 font-normal">ሁለተኛ ቋንቋ</div>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Bell className="w-4 h-4 text-brand-600" />
            <h3>Opportunity Notifications</h3>
          </div>
          <p className="text-xs text-slate-500">
            Receive in-app alerts when deadlines approach or submissions are verified.
          </p>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deadlineAlerts}
                onChange={(e) => setDeadlineAlerts(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>Send upcoming deadline reminders for tracked opportunities</span>
            </label>

            <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reviewAlerts}
                onChange={(e) => setReviewAlerts(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>Notify me when my submitted opportunities are approved or reviewed</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="md" type="submit" disabled={isSaving} icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={handleSaveAndGo}
            disabled={isSaving}
            icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 ml-1" />}
          >
            {isSaving ? 'Saving...' : 'Save & Continue to Dashboard'}
          </Button>
        </div>
      </form>
    </div>
  );
};
