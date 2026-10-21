import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  User as UserIcon,
  Globe,
  Bell,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LayoutDashboard,
  Loader2,
  GraduationCap,
  ShieldCheck,
  Building,
  AtSign,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { ApiClient } from '../services/api';
import { profileService } from '../services/profileService';
import { User, StudentProfile, DegreeLevel, WorkArrangement } from '../types';
import { ETHIOPIAN_UNIVERSITIES, STEM_FIELDS_OF_STUDY } from '../constants/academic';
import { Button } from '../components/common/Button';
import { ProfilePictureEditor } from '../components/profile/ProfilePictureEditor';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { user, updateUser } = useAuth();

  // Basic Profile State
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [institution, setInstitution] = useState(user?.institution || '');

  // Academic Profile State (For Students)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [university, setUniversity] = useState('ASTU (Adama Science and Technology University)');
  const [fieldOfStudy, setFieldOfStudy] = useState('Software Engineering');
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>('undergraduate');
  const [graduationYear, setGraduationYear] = useState<number>(2026);
  const [skillsInput, setSkillsInput] = useState('');
  const [preferredArrangements, setPreferredArrangements] = useState<WorkArrangement[]>([
    'on_site',
    'remote',
    'hybrid',
  ]);

  // Preferences State
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);

  // Status & Feedback
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing profile from backend
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await profileService.getProfile();
        if (isMounted) {
          if (data.user) {
            setName(data.user.name || '');
            setUsername(data.user.username || '');
            setBio(data.user.bio || '');
            setInstitution(data.user.institution || '');
            if (data.user.preferences) {
              setDeadlineAlerts(Boolean(data.user.preferences.deadlineAlerts));
              setReviewAlerts(Boolean(data.user.preferences.reviewAlerts));
              if (data.user.preferences.language) {
                setLanguage(data.user.preferences.language);
              }
            }
          }
          if (data.studentProfile) {
            setStudentProfile(data.studentProfile);
            setUniversity(data.studentProfile.university || 'ASTU (Adama Science and Technology University)');
            setFieldOfStudy(data.studentProfile.fieldOfStudy || 'Software Engineering');
            setDegreeLevel(data.studentProfile.degreeLevel || 'undergraduate');
            setGraduationYear(data.studentProfile.graduationYear || 2026);
            setSkillsInput((data.studentProfile.skills || []).join(', '));
            if (data.studentProfile.preferredArrangements) {
              setPreferredArrangements(data.studentProfile.preferredArrangements);
            }
          }
        }
      } catch (err: any) {
        console.warn('Could not load complete profile, using auth context state:', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [setLanguage]);

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'submitter') return '/submission-status';
    return '/dashboard';
  };

  const handleToggleArrangement = (arr: WorkArrangement) => {
    setPreferredArrangements((prev) =>
      prev.includes(arr) ? prev.filter((a) => a !== arr) : [...prev, arr]
    );
  };

  const handleReset = () => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setInstitution(user.institution || '');
    }
    if (studentProfile) {
      setUniversity(studentProfile.university || '');
      setFieldOfStudy(studentProfile.fieldOfStudy || '');
      setDegreeLevel(studentProfile.degreeLevel || 'undergraduate');
      setGraduationYear(studentProfile.graduationYear || 2026);
      setSkillsInput((studentProfile.skills || []).join(', '));
      setPreferredArrangements(studentProfile.preferredArrangements || ['on_site', 'remote', 'hybrid']);
    }
    setErrorMessage(null);
    setSavedSuccess(false);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      // 1. Client-side Username validation
      const cleanedUsername = username.trim().toLowerCase();
      if (cleanedUsername && !/^[a-z0-9_-]{3,30}$/.test(cleanedUsername)) {
        throw new Error(
          'Username must be between 3 and 30 characters and contain only lowercase letters, numbers, underscores, or hyphens.'
        );
      }

      // Parse skills input
      const parsedSkills = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // 2. Save Profile details to /profile/me
      const profilePayload: any = {
        name: name.trim(),
        username: cleanedUsername || undefined,
        bio: bio.trim(),
        institution: institution.trim(),
      };

      if (user?.role === 'student') {
        profilePayload.university = university;
        profilePayload.fieldOfStudy = fieldOfStudy;
        profilePayload.degreeLevel = degreeLevel;
        profilePayload.graduationYear = graduationYear;
        profilePayload.skills = parsedSkills;
        profilePayload.preferredArrangements = preferredArrangements;
      }

      const updated = await profileService.updateProfile(profilePayload);

      // 3. Save Preferences to /profile/preferences
      await ApiClient.request<{ user: User }>('/profile/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          deadlineAlerts,
          reviewAlerts,
          language,
        }),
      });

      // 4. Update application state
      if (updated.user) {
        updateUser(updated.user);
      } else {
        updateUser({
          name: name.trim(),
          username: cleanedUsername,
          bio: bio.trim(),
          institution: institution.trim(),
          preferences: { deadlineAlerts, reviewAlerts, language },
        });
      }

      if (updated.studentProfile) {
        setStudentProfile(updated.studentProfile);
      }

      setSavedSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save account settings. Please review input.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    if (role === 'admin') return 'Administrator (መድረክ አስተዳዳሪ)';
    if (role === 'submitter') return 'Opportunity Submitter (የስራ አጋር ድርጅት)';
    return 'Student (የዩኒቨርሲቲ ተማሪ)';
  };

  if (isLoadingProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          {language === 'am' ? 'የመለያ መረጃ በመጫን ላይ...' : 'Loading account profile settings...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-brand-600" />
            <span>{t('nav.settings')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'am'
              ? 'የመለያ መረጃዎን፣ የተጠቃሚ ስም፣ ፎቶ እና ማሳወቂያዎችን ያስተዳድሩ።'
              : 'Manage your profile information, unique username, avatar, and notification preferences.'}
          </p>
        </div>

        <Link to={getDashboardPath()}>
          <Button variant="outline" size="sm" icon={<LayoutDashboard className="w-4 h-4 text-brand-600" />}>
            <span>{language === 'am' ? 'ዳሽቦርድ' : 'Dashboard'}</span>
          </Button>
        </Link>
      </div>

      {/* Notifications / Alerts */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {language === 'am'
                ? 'የመለያ ቅንብሮች በተሳካ ሁኔታ ተቀምጠዋል።'
                : 'All account settings and profile information saved successfully.'}
            </span>
          </div>
          <Link to={getDashboardPath()}>
            <Button variant="outline" size="sm" className="bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100/60">
              <span>{language === 'am' ? 'ወደ ዳሽቦርድ ይሂዱ' : 'Go to Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: Profile Picture Management (All Roles) */}
      <ProfilePictureEditor />

      {/* SECTION 2: General Profile Information (All Roles) */}
      <form onSubmit={handleSaveAll} className="space-y-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'am' ? 'የመለያ መረጃ' : 'Profile Information'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'am'
                  ? 'በመድረኩ ላይ ለሌሎች ተጠቃሚዎች የሚታይ መረጃ'
                  : 'Your public identity across TemariHub'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'am' ? 'ሙሉ ስም (የማሳያ ስም)' : 'Display Name'} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Petros Sisay"
                className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Unique Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>{language === 'am' ? 'ልዩ የተጠቃሚ ስም' : 'Unique Username'}</span>
                <span className="text-[10px] text-slate-400 font-normal">3-30 chars</span>
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="e.g. petros_astu"
                  maxLength={30}
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 pl-9 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'am'
                  ? 'ፊደሎች፣ ቁጥሮች፣ _ እና - ብቻ መጠቀም ይቻላል።'
                  : 'Letters, numbers, underscores, and hyphens only.'}
              </p>
            </div>

            {/* Organization or Institution */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {user?.role === 'submitter'
                  ? (language === 'am' ? 'የድርጅት ስም' : 'Company / Organization Name')
                  : (language === 'am' ? 'ተቋም ወይም ዩኒቨርሲቲ' : 'Institution / University')}
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Adama Science and Technology University or Safaricom Ethiopia"
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 pl-9 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Biography / About Me */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>{language === 'am' ? 'ስለ እኔ (አጭር መግለጫ)' : 'Biography / About Me'}</span>
                <span className="text-[10px] text-slate-400 font-normal">{bio.length}/1000</span>
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={1000}
                placeholder={
                  language === 'am'
                    ? 'ስለ ሙያዊ ፍላጎትዎ ወይም የስራ ልምድዎ በአጭሩ ይግለጹ...'
                    : 'A brief bio highlighting your background, passions, or company mission...'
                }
                className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Academic Profile Information (Student Only) */}
        {user?.role === 'student' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'am' ? 'የትምህርት መረጃ (የተማሪ መገለጫ)' : 'Academic Information (Student Profile)'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'am'
                    ? 'ለተገቢ የስራ እና የተለማማጅነት እድሎች ተስማሚነትን ለመወሰን የሚያገለግል'
                    : 'Helps match you with verified internships, scholarships, and junior tech roles'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* University */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'am' ? 'ዩኒቨርሲቲ / ተቋም' : 'University / College'} *
                </label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {ETHIOPIAN_UNIVERSITIES.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field of Study */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'am' ? 'የጥናት መስክ' : 'Field of Study'} *
                </label>
                <select
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {STEM_FIELDS_OF_STUDY.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>

              {/* Degree Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'am' ? 'የትምህርት ደረጃ' : 'Degree / Academic Level'} *
                </label>
                <select
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value as DegreeLevel)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="undergraduate">Undergraduate (ቅድመ-ምረቃ)</option>
                  <option value="postgraduate">Postgraduate / Masters (ድህረ-ምረቃ)</option>
                  <option value="phd">PhD (ዶክትሬት)</option>
                  <option value="tvet">TVET / Diploma</option>
                  <option value="recent_graduate">Recent Graduate (አዲስ ተመራቂ)</option>
                </select>
              </div>

              {/* Graduation Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'am' ? 'የምረቃ አመት' : 'Expected Graduation Year'}
                </label>
                <input
                  type="number"
                  min={2020}
                  max={2035}
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(parseInt(e.target.value, 10))}
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Skills and Technical Interests */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'am' ? 'የቴክኒክ ክህሎቶች (በኮማ ይለዩ)' : 'Skills & Tech Stack (comma-separated)'}
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. React, TypeScript, Node.js, Python, Docker"
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Preferred Work Arrangement */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'am' ? 'ተመራጭ የስራ ሁኔታ' : 'Preferred Work Arrangement'}
                </label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {(['on_site', 'remote', 'hybrid'] as WorkArrangement[]).map((arr) => (
                    <label key={arr} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={preferredArrangements.includes(arr)}
                        onChange={() => handleToggleArrangement(arr)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                      />
                      <span className="capitalize">{arr.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Preferences (Language & Notifications) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'am' ? 'የቋንቋ እና የማሳወቂያ ምርጫዎች' : 'Platform Preferences'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'am'
                  ? 'የመተግበሪያውን ቋንቋ እና የመልዕክት ቅንብሮችን ይቀይሩ'
                  : 'Customize display language and deadline alert notifications'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Language Selection */}
            <div>
              <h3 className="text-xs font-semibold text-slate-800 mb-2">
                {language === 'am' ? 'የቋንቋ ምርጫ' : 'Display Language'}
              </h3>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    language === 'en'
                      ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">English</div>
                  <div className="text-[10px] text-slate-500">Primary Language</div>
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
                  <div className="text-xs font-bold">አማርኛ (Amharic)</div>
                  <div className="text-[10px] text-slate-500">ሁለተኛ ቋንቋ</div>
                </button>
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                <Bell className="w-4 h-4 text-brand-600" />
                <span>{language === 'am' ? 'የማሳወቂያ ቅንብሮች' : 'Opportunity Notifications'}</span>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deadlineAlerts}
                    onChange={(e) => setDeadlineAlerts(e.target.checked)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                  />
                  <span>
                    {language === 'am'
                      ? 'ለተከታተሏቸው እድሎች የቀረበ የጊዜ ገደብ ማስታወሻዎችን ይላኩ'
                      : 'Send upcoming deadline reminders for tracked opportunities'}
                  </span>
                </label>

                <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reviewAlerts}
                    onChange={(e) => setReviewAlerts(e.target.checked)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                  />
                  <span>
                    {language === 'am'
                      ? 'የቀረቡ የስራ እድሎች ሲረጋገጡ ማሳወቂያ ይላኩ'
                      : 'Notify me when submitted opportunities are reviewed or verified'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Account & Security Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'am' ? 'የአካውንት ደህንነት እና ማረጋገጫ' : 'Account & Security Identity'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'am'
                  ? 'በጉግል የተረጋገጠ የመለያ ማንነት'
                  : 'Server-verified authentication credentials and platform permissions'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Authenticated Email */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'am' ? 'የተረጋገጠ የጉግል ኢሜይል' : 'Verified Google Email'}
              </span>
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <span>{user?.email}</span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              </div>
            </div>

            {/* Authenticated Role */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'am' ? 'የአካውንት ሚና' : 'Current Role & Permissions'}
              </span>
              <div className="font-semibold text-slate-900">
                {getRoleLabel(user?.role)}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
            <span className="font-semibold text-slate-700">Security note:</span> Google account
            identity and privileged roles are cryptographically verified by the server. Users cannot
            alter their authenticated email or role boundaries directly.
          </p>
        </div>

        {/* Form Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            icon={<RotateCcw className="w-4 h-4 text-slate-500" />}
          >
            {language === 'am' ? 'ለውጦችን ሰርዝ' : 'Cancel Changes'}
          </Button>

          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={isSaving}
            icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          >
            {isSaving
              ? (language === 'am' ? 'በማስቀመጥ ላይ...' : 'Saving Changes...')
              : (language === 'am' ? 'ቅንብሮችን አስቀምጥ' : 'Save Profile & Settings')}
          </Button>
        </div>
      </form>
    </div>
  );
};
