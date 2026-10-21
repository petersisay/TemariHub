import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Bookmark,
  Kanban,
  PlusCircle,
  ShieldCheck,
  User as UserIcon,
  Globe,
  Menu,
  X,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useTranslation, Language } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import { Avatar } from './Avatar';

export const Navbar: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLang: Language = language === 'en' ? 'am' : 'en';
    setLanguage(nextLang);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClass = (path: string) =>
    `inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-brand-50 text-brand-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 focus:outline-none group">
            <img
              src="/temarihub-logo.png"
              alt="TemariHub Logo"
              className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1">
                Temari<span className="text-brand-600">Hub</span>
              </span>
              <span className="block text-[10px] font-medium text-slate-500 -mt-1 tracking-wider uppercase">
                {language === 'am' ? 'የተማሪዎች የዕድል መድረክ' : 'Ethiopian STEM Careers'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link to="/opportunities" className={navLinkClass('/opportunities')}>
              <Compass className="w-4 h-4 text-slate-500" />
              <span>{t('nav.opportunities')}</span>
            </Link>

            {role === 'student' && (
              <>
                <Link to="/tracker" className={navLinkClass('/tracker')}>
                  <Kanban className="w-4 h-4 text-slate-500" />
                  <span>{t('nav.tracker')}</span>
                </Link>
                <Link to="/saved" className={navLinkClass('/saved')}>
                  <Bookmark className="w-4 h-4 text-slate-500" />
                  <span>{t('nav.saved')}</span>
                </Link>
              </>
            )}

            {(role === 'submitter' || role === 'admin') && (
              <Link to="/submit" className={navLinkClass('/submit')}>
                <PlusCircle className="w-4 h-4 text-slate-500" />
                <span>{t('nav.submit')}</span>
              </Link>
            )}

            {role === 'admin' && (
              <Link to="/admin" className={navLinkClass('/admin')}>
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span className="font-semibold text-brand-700">{t('nav.admin')}</span>
              </Link>
            )}
          </nav>

          {/* Actions & Controls */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              title="Toggle English / Amharic"
            >
              <Globe className="w-3.5 h-3.5 text-brand-600" />
              <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
              <Badge variant="neutral" size="sm" className="px-1 py-0 text-[10px]">
                {language.toUpperCase()}
              </Badge>
            </button>

            {/* Profile or Login */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <Link
                  to={role === 'student' ? '/profile' : role === 'admin' ? '/admin' : '/submission-status'}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Avatar
                    src={user.avatarUrl}
                    name={user.name}
                    size="sm"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
                </Link>
                <Link
                  to="/settings"
                  title={t('nav.settings')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                >
                  <SettingsIcon className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-brand-600 px-3 py-2 rounded-lg"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-brand-600 text-white px-3.5 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 text-xs font-semibold rounded border border-slate-200 text-slate-700 flex items-center gap-1"
            >
              <Globe className="w-3 h-3 text-brand-600" />
              <span>{language === 'en' ? 'አማ' : 'EN'}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-Down Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/opportunities"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Compass className="w-4 h-4 text-slate-500" />
            <span>{t('nav.opportunities')}</span>
          </Link>

          {role === 'student' && (
            <>
              <Link
                to="/tracker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Kanban className="w-4 h-4 text-slate-500" />
                <span>{t('nav.tracker')}</span>
              </Link>
              <Link
                to="/saved"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Bookmark className="w-4 h-4 text-slate-500" />
                <span>{t('nav.saved')}</span>
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <UserIcon className="w-4 h-4 text-slate-500" />
                <span>{t('nav.profile')}</span>
              </Link>
            </>
          )}

          {(role === 'submitter' || role === 'admin') && (
            <Link
              to="/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <PlusCircle className="w-4 h-4 text-slate-500" />
              <span>{t('nav.submit')}</span>
            </Link>
          )}

          {role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-brand-700 bg-brand-50"
            >
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>{t('nav.admin')}</span>
            </Link>
          )}

          {user && (
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <SettingsIcon className="w-4 h-4 text-slate-500" />
              <span>{t('nav.settings')}</span>
            </Link>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {user && (
                <Avatar
                  src={user.avatarUrl}
                  name={user.name}
                  size="xs"
                />
              )}
              <span className="text-xs text-slate-500 font-medium">
                {user ? user.name : 'Not signed in'}
              </span>
            </div>
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-brand-600 font-semibold"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
