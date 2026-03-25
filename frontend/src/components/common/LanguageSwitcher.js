import React from 'react';
import { ChevronDownIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../context/LanguageContext';

const LanguageSwitcher = ({ className = '' }) => {
  const { language, setLanguage, t } = useLanguage();
  const currentFlag = language === 'km' ? 'KH' : 'EN';

  return (
    <label className={`inline-flex items-center gap-2 text-xs text-slate-600 ${className}`}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        <LanguageIcon className="h-4 w-4" />
      </span>
      <span className="relative inline-flex min-w-[132px] items-center">
        <span className="pointer-events-none absolute left-3 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <span className="inline-flex h-6 min-w-[30px] items-center justify-center rounded-md bg-emerald-50 px-1.5 text-[11px] font-semibold tracking-wide text-emerald-700">
            {currentFlag}
          </span>
        </span>
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          aria-label={t('label_language', 'Language')}
          className="h-11 min-w-[132px] appearance-none rounded-2xl border border-emerald-300 bg-white py-2 pl-14 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        >
          <option value="en">{t('language_en', 'English')}</option>
          <option value="km">{t('language_km', 'Khmer')}</option>
        </select>
        <span className="pointer-events-none absolute right-3 text-slate-500">
          <ChevronDownIcon className="h-4 w-4" />
        </span>
      </span>
    </label>
  );
};

export default LanguageSwitcher;
