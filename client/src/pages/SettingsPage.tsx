import React, { useState } from 'react';
import { Settings, Globe, Bell, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-7 h-7 text-brand-600" />
          <span>{t('nav.settings')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Customize your language and platform preferences.
        </p>
      </div>

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

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="md" type="submit">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
