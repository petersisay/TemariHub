import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton } from '../components/common/GoogleAuthButton';

export const RegisterPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatic redirect if user already has an active authenticated session
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'submitter') {
        navigate('/submission-status', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16 space-y-6">
      {/* Branding Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-200 shadow-xs">
          <UserPlus className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('auth.registerTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
          {t('auth.registerSubtitle')}
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Benefits bullets */}
        <div className="space-y-2 pb-2">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'am'
                ? 'የተረጋገጡ የኢትዮጵያ የስራ እና የተለማማጅነት እድሎች'
                : 'Verified Ethiopian internships and career opportunities'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'am'
                ? 'የማመልከቻ ሂደት መከታተያ እና የጊዜ ገደብ ማስታወሻዎች'
                : 'Personalized application tracker with deadline alerts'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'am'
                ? 'ለዩኒቨርሲቲ ተማሪዎች የተዘጋጀ ነፃ መድረክ'
                : '100% free platform tailored for university students'}
            </span>
          </div>
        </div>

        {/* Google-First Sign Up */}
        <div className="space-y-4">
          <GoogleAuthButton
            mode="register"
            onError={(err) => setErrorMessage(err)}
            onSuccess={() => setErrorMessage(null)}
          />

          <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/60 text-[11px] text-brand-900 flex items-start gap-2.5 leading-relaxed">
            <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <span>
              {language === 'am'
                ? 'በጉግል ሲመዘገቡ የተማሪ አካውንት በቀጥታ ይፈጠራል። የአጋር ድርጅት እና አስተዳዳሪ ፈቃዶች በይፋዊ አሰራር ይመደባሉ።'
                : 'Student accounts are automatically created via Google. Submitter and Administrator roles are assigned securely via institutional verification.'}
            </span>
          </div>
        </div>

        {/* Navigation to Login */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            {language === 'am' ? 'ቀደም ሲል አካውንት አለዎት?' : 'Already have an account?'}{' '}
            <Link
              to="/login"
              className="text-brand-600 font-semibold hover:text-brand-700 inline-flex items-center gap-1 ml-1"
            >
              <span>{language === 'am' ? 'በጉግል ይግቡ' : 'Sign in with Google'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>

      {/* Footer Legal Links */}
      <div className="text-center text-[11px] text-slate-400 space-x-3">
        <span>TemariHub © 2026</span>
        <span>•</span>
        <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
        <span>•</span>
        <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
      </div>
    </div>
  );
};
