import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageSwitcher = ({ className = '' }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`inline-flex items-center gap-2 text-xs text-slate-600 ${className}`}>
      <span>{t('label_language', 'Language')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
      >
        <option value="en">EN</option>
        <option value="km">KM</option>
      </select>
    </label>
  );
};

export default LanguageSwitcher;