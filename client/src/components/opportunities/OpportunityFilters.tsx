import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { OpportunityFilterParams, OpportunityType, WorkArrangement, DegreeLevel } from '../../types';
import { useTranslation } from '../../context/I18nContext';
import { STEM_FIELDS_OF_STUDY } from '../../constants/academic';

interface OpportunityFiltersProps {
  filters: OpportunityFilterParams;
  onChange: (newFilters: OpportunityFilterParams) => void;
  onReset: () => void;
}

export const OpportunityFilters: React.FC<OpportunityFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const { t } = useTranslation();

  const handleTypeToggle = (type: OpportunityType) => {
    const current = filters.types || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onChange({ ...filters, types: updated, page: 1 });
  };

  const handleArrangementToggle = (arr: WorkArrangement) => {
    const current = filters.arrangements || [];
    const updated = current.includes(arr)
      ? current.filter((a) => a !== arr)
      : [...current, arr];
    onChange({ ...filters, arrangements: updated, page: 1 });
  };

  const handleLevelToggle = (lvl: DegreeLevel) => {
    const current = filters.levels || [];
    const updated = current.includes(lvl)
      ? current.filter((l) => l !== lvl)
      : [...current, lvl];
    onChange({ ...filters, levels: updated, page: 1 });
  };

  const opportunityTypes: OpportunityType[] = [
    'internship',
    'entry_level_job',
    'scholarship',
    'hackathon',
    'fellowship',
    'training',
  ];

  const arrangements: WorkArrangement[] = ['on_site', 'remote', 'hybrid'];

  const levels: DegreeLevel[] = [
    'undergraduate',
    'postgraduate',
    'recent_graduate',
    'tvet',
    'phd',
  ];

  return (
    <aside className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Filter className="w-4 h-4 text-brand-600" />
          <span>{t('filter.title')}</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t('filter.clearAll')}</span>
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          {t('filter.sortBy')}
        </label>
        <select
          value={filters.sortBy || 'newest'}
          onChange={(e) =>
            onChange({ ...filters, sortBy: e.target.value as any, page: 1 })
          }
          className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="newest">{t('filter.sort_newest')}</option>
          <option value="deadline_asc">{t('filter.sort_deadline_asc')}</option>
          <option value="deadline_desc">{t('filter.sort_deadline_desc')}</option>
        </select>
      </div>

      {/* Field of Study Dropdown */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          {t('filter.field')}
        </label>
        <select
          value={filters.field || 'All Fields'}
          onChange={(e) => onChange({ ...filters, field: e.target.value, page: 1 })}
          className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="All Fields">{t('filter.allFields')}</option>
          {STEM_FIELDS_OF_STUDY.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>
      </div>

      {/* Opportunity Type Checkboxes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          {t('filter.types')}
        </label>
        <div className="space-y-1.5">
          {opportunityTypes.map((type) => {
            const isChecked = (filters.types || []).includes(type);
            return (
              <label
                key={type}
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleTypeToggle(type)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                />
                <span>{t(`filter.type_${type}`)}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Location Scope (Ethiopia, Remote, International) */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Scope / Geographic Focus
        </label>
        <div className="space-y-1.5">
          {[
            { id: 'all', label: 'All Locations' },
            { id: 'ethiopia', label: 'Ethiopia-based Opportunities' },
            { id: 'remote', label: 'Remote Opportunities' },
            { id: 'international', label: 'International Opportunities' },
          ].map((scope) => (
            <label
              key={scope.id}
              className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none"
            >
              <input
                type="radio"
                name="locationScope"
                checked={
                  (!filters.locationScope && scope.id === 'all') ||
                  filters.locationScope === scope.id
                }
                onChange={() =>
                  onChange({
                    ...filters,
                    locationScope: scope.id === 'all' ? undefined : (scope.id as any),
                    page: 1,
                  })
                }
                className="text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
              />
              <span>{scope.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Work Arrangement Checkboxes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          {t('filter.arrangement')}
        </label>
        <div className="space-y-1.5">
          {arrangements.map((arr) => {
            const isChecked = (filters.arrangements || []).includes(arr);
            return (
              <label
                key={arr}
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleArrangementToggle(arr)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                />
                <span>{t(`filter.arr_${arr}`)}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Academic Level */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          {t('filter.level')}
        </label>
        <div className="space-y-1.5">
          {levels.map((lvl) => {
            const isChecked = (filters.levels || []).includes(lvl);
            return (
              <label
                key={lvl}
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleLevelToggle(lvl)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                />
                <span>{t(`filter.lvl_${lvl}`)}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Include Expired Toggle */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!filters.includeExpired}
            onChange={(e) =>
              onChange({ ...filters, includeExpired: e.target.checked, page: 1 })
            }
            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
          />
          <span>{t('filter.includeExpired')}</span>
        </label>
      </div>
    </aside>
  );
};
