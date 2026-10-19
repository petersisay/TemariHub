import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../context/I18nContext';
import { opportunityService } from '../services/opportunityService';
import { OpportunityType, WorkArrangement, DegreeLevel } from '../types';
import { STEM_FIELDS_OF_STUDY } from '../services/fixtures';
import { Button } from '../components/common/Button';

export const SubmitOpportunityPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [oppType, setOppType] = useState<OpportunityType>('internship');
  const [arrangement, setArrangement] = useState<WorkArrangement>('hybrid');
  const [location, setLocation] = useState('Addis Ababa');
  const [deadline, setDeadline] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>(['Software Engineering', 'Computer Science']);
  const [selectedLevels, setSelectedLevels] = useState<DegreeLevel[]>(['undergraduate', 'recent_graduate']);
  const [skillsInput, setSkillsInput] = useState('React, TypeScript, Python');
  const [originalSourceUrl, setOriginalSourceUrl] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [compType, setCompType] = useState<'paid' | 'unpaid' | 'stipend' | 'competitive'>('stipend');
  const [compAmount, setCompAmount] = useState<string>('8000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const skills = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await opportunityService.submitOpportunity({
        title,
        organization: {
          name: orgName,
          websiteUrl: orgWebsite,
          isVerified: false,
        },
        opportunityType: oppType,
        description,
        eligibleFields: selectedFields,
        eligibleLevels: selectedLevels,
        requiredSkills: skills,
        location,
        workArrangement: arrangement,
        deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isRollingDeadline: isRolling,
        compensation: {
          type: compType,
          amount: compAmount ? parseInt(compAmount, 10) : undefined,
          currency: 'ETB',
          period: 'monthly',
        },
        originalSourceUrl,
        applicationUrl,
      });

      navigate('/submission-status?success=true');
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter((f) => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const toggleLevel = (lvl: DegreeLevel) => {
    if (selectedLevels.includes(lvl)) {
      setSelectedLevels(selectedLevels.filter((l) => l !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  const opportunityTypes: OpportunityType[] = [
    'internship',
    'entry_level_job',
    'scholarship',
    'hackathon',
    'fellowship',
    'training',
  ];

  const levels: DegreeLevel[] = [
    'undergraduate',
    'postgraduate',
    'recent_graduate',
    'tvet',
    'phd',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <PlusCircle className="w-7 h-7 text-brand-600" />
          <span>{t('submit.title')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('submit.subtitle')}
        </p>
      </div>

      {/* Moderation Policy Notice */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Two-Tier Publishing & Anti-Scam Protection</span>
          <p className="leading-relaxed">
            {t('submit.notice')} Original source links are verified by administrators.
            Submissions with fraudulent or deceptive claims are immediately rejected and blacklisted.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Organization Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('submit.orgName')} *
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. ASTU Robotics Lab, Safaricom, ALX"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('submit.orgWebsite')}
            </label>
            <input
              type="url"
              value={orgWebsite}
              onChange={(e) => setOrgWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Opportunity Title & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('submit.oppTitle')} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Junior Python Backend Developer"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('submit.oppType')} *
            </label>
            <select
              value={oppType}
              onChange={(e) => setOppType(e.target.value as OpportunityType)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {opportunityTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`filter.type_${type}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location & Arrangement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('submit.location')} *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Adama, Addis Ababa, Hawassa, Remote"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('submit.workArrangement')} *
            </label>
            <select
              value={arrangement}
              onChange={(e) => setArrangement(e.target.value as WorkArrangement)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="on_site">On-Site (በአካል)</option>
              <option value="remote">Remote (ከሩቅ / ከቤት)</option>
              <option value="hybrid">Hybrid (ቅይጥ)</option>
            </select>
          </div>
        </div>

        {/* Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('submit.deadline')} *
            </label>
            <input
              type="date"
              required={!isRolling}
              disabled={isRolling}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
            />
          </div>

          <div className="pt-5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRolling}
                onChange={(e) => setIsRolling(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>{t('submit.isRolling')}</span>
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('submit.description')} *
          </label>
          <textarea
            rows={5}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline role responsibilities, prerequisites, key learning outcomes, and application criteria..."
            className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
          />
        </div>

        {/* Eligible Academic Disciplines */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            {t('submit.eligibleFields')} *
          </label>
          <div className="flex flex-wrap gap-2">
            {STEM_FIELDS_OF_STUDY.map((f) => {
              const isSelected = selectedFields.includes(f);
              return (
                <button
                  type="button"
                  key={f}
                  onClick={() => toggleField(f)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Required Skills */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('submit.requiredSkills')} *
          </label>
          <input
            type="text"
            required
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g. Python, Docker, React, Linux"
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Eligible Academic Levels */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Eligible Academic Levels *
          </label>
          <div className="flex flex-wrap gap-2">
            {levels.map((lvl) => {
              const isSelected = selectedLevels.includes(lvl);
              return (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => toggleLevel(lvl)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all capitalize ${
                    isSelected
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {lvl.replace('_', ' ')} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compensation Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('submit.compensationType')}
            </label>
            <select
              value={compType}
              onChange={(e) => setCompType(e.target.value as any)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="stipend">Monthly Stipend (የወር አበል)</option>
              <option value="paid">Full Salary (ደመወዝ)</option>
              <option value="unpaid">Unpaid / Educational (ያልተከፈለ)</option>
              <option value="competitive">Competitive / To be Discussed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('submit.compensationAmount')}
            </label>
            <input
              type="number"
              value={compAmount}
              onChange={(e) => setCompAmount(e.target.value)}
              placeholder="e.g. 7500"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Mandatory Verification & Source URLs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {t('submit.originalSourceUrl')} *
            </label>
            <input
              type="url"
              required
              value={originalSourceUrl}
              onChange={(e) => setOriginalSourceUrl(e.target.value)}
              placeholder="https://company.et/careers/post-1"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Official website announcement or university notice link.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {t('submit.applicationUrl')} *
            </label>
            <input
              type="url"
              required
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
              placeholder="https://company.et/apply or Google Form URL"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Where students directly fill out application materials.
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button variant="primary" size="lg" type="submit" isLoading={isSubmitting}>
            {t('submit.submitBtn')}
          </Button>
        </div>
      </form>
    </div>
  );
};
