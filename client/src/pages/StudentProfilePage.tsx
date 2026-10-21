import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, Save } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { profileService } from '../services/profileService';
import { StudentProfile, DegreeLevel, WorkArrangement } from '../types';
import { ETHIOPIAN_UNIVERSITIES, STEM_FIELDS_OF_STUDY } from '../constants/academic';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ProfilePictureEditor } from '../components/profile/ProfilePictureEditor';

export const StudentProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [skillsInput, setSkillsInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    profileService.getStudentProfile().then((data) => {
      setProfile(data);
      setSkillsInput((data?.skills || []).join(', '));
      setIsLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);

    const parsedSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated = await profileService.updateStudentProfile({
      ...profile,
      skills: parsedSkills,
    });

    setProfile(updated);
    setIsSaving(false);
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 3000);
  };

  const toggleArrangement = (arr: WorkArrangement) => {
    if (!profile) return;
    const current = profile.preferredArrangements || [];
    const updated = current.includes(arr)
      ? current.filter((a) => a !== arr)
      : [...current, arr];
    setProfile({ ...profile, preferredArrangements: updated });
  };

  if (isLoading || !profile) {
    return <LoadingSpinner message="Loading your student profile..." />;
  }

  const degreeLevels: DegreeLevel[] = [
    'undergraduate',
    'postgraduate',
    'phd',
    'tvet',
    'recent_graduate',
  ];

  const arrangements: WorkArrangement[] = ['on_site', 'remote', 'hybrid'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {successNotice && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{t('profile.savedSuccess')}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-7 h-7 text-brand-600" />
          <span>{t('profile.title')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Profile Picture Management */}
      <ProfilePictureEditor />

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* University & Degree */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('profile.university')}
            </label>
            <select
              value={profile.university}
              onChange={(e) => setProfile({ ...profile, university: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {ETHIOPIAN_UNIVERSITIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('profile.degreeLevel')}
            </label>
            <select
              value={profile.degreeLevel}
              onChange={(e) =>
                setProfile({ ...profile, degreeLevel: e.target.value as DegreeLevel })
              }
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
            >
              {degreeLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {t(`filter.lvl_${lvl}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom University if 'Other' selected */}
        {profile.university.includes('Other') && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('profile.customUniversity')}
            </label>
            <input
              type="text"
              required
              value={profile.customUniversity || ''}
              onChange={(e) => setProfile({ ...profile, customUniversity: e.target.value })}
              placeholder="e.g., ASTU Extension / Private Institute Name"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        {/* Field of Study & Grad Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('profile.fieldOfStudy')}
            </label>
            <select
              value={profile.fieldOfStudy}
              onChange={(e) => setProfile({ ...profile, fieldOfStudy: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {STEM_FIELDS_OF_STUDY.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('profile.graduationYear')}
            </label>
            <input
              type="number"
              min="2020"
              max="2035"
              value={profile.graduationYear}
              onChange={(e) =>
                setProfile({ ...profile, graduationYear: parseInt(e.target.value, 10) })
              }
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Skills Tag Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('profile.skills')}
          </label>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g. React, Python, Docker, Flutter, C++, PyTorch"
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">{t('profile.skillsHelp')}</p>
        </div>

        {/* Preferred Work Arrangements */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            {t('profile.preferredArrangements')}
          </label>
          <div className="flex flex-wrap gap-3">
            {arrangements.map((arr) => {
              const isSelected = profile.preferredArrangements.includes(arr);
              return (
                <button
                  type="button"
                  key={arr}
                  onClick={() => toggleArrangement(arr)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t(`filter.arr_${arr}`)} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('profile.bio')}
          </label>
          <textarea
            rows={3}
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell recruiters and research labs about your engineering interests..."
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              GitHub Profile URL
            </label>
            <input
              type="url"
              value={profile.githubUrl || ''}
              onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
              placeholder="https://github.com/username"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              value={profile.linkedinUrl || ''}
              onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/username"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button variant="primary" size="md" type="submit" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
            {t('profile.saveBtn')}
          </Button>
        </div>
      </form>
    </div>
  );
};
