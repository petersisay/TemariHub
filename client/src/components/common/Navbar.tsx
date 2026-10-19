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
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useTranslation, Language } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { user, role, switchDemoRole, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

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
      {/* Demo Role Switcher Ribbon for Phase 1 verification */}
      <div className="bg-navy-950 text-white text-xs px-4 py-1.5 flex items-center justify-between border-b border-navy-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Phase 1 Frontend Foundation — Live UI Verification
          </span>
          <span className="text-slate-300 sm:hidden">TemariHub MVP</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden md:inline">{t('nav.demoRole')}:</span>
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="bg-navy-800 hover:bg-navy-700 text-amber-300 font-medium px-2.5 py-0.5 rounded border border-navy-700 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="capitalize">{role}</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>
            {roleMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-slate-800 z-50 animate-in fade-in zoom-in-95">
                {(['student', 'submitter', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchDemoRole(r);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-brand-50 flex items-center justify-between ${
                      role === r ? 'font-bold text-brand-600 bg-brand-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{r} View</span>
                    {role === r && <span className="text-brand-600">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 focus:outline-none group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-navy-950 via-brand-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform">
              T
            </div>
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
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link
                  to={role === 'student' ? '/profile' : role === 'admin' ? '/admin' : '/submission-status'}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
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

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {user ? `Logged in as ${user.name}` : 'Not signed in'}
            </span>
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
