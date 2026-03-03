import React, { createContext, useContext, useMemo, useState } from 'react';

const LANGUAGE_STORAGE_KEY = 'app_language';

const translations = {
  en: {
    nav_home: 'Home',
    nav_fields: 'Fields',
    nav_teams: 'Teams',
    nav_login: 'Login',
    nav_register: 'Register',
    nav_dashboard: 'Dashboard',
    nav_bookings: 'Bookings',
    nav_profile: 'Profile',
    nav_notifications: 'Notifications',
    nav_analytics: 'Analytics',
    nav_my_fields: 'My Fields',
    nav_booking_requests: 'Booking Requests',
    action_logout: 'Logout',
    action_go_dashboard: 'Go to Dashboard',
    workspace_player: 'Player & Captain Panel',
    workspace_owner: 'Field Owner Panel',
    label_workspace: 'Workspace',
    label_language: 'Language'
  },
  km: {
    nav_home: 'ទំព័រដើម',
    nav_fields: 'ទីលាន',
    nav_teams: 'ក្រុម',
    nav_login: 'ចូលគណនី',
    nav_register: 'ចុះឈ្មោះ',
    nav_dashboard: 'ផ្ទាំងគ្រប់គ្រង',
    nav_bookings: 'ការកក់',
    nav_profile: 'ប្រវត្តិរូប',
    nav_notifications: 'ការជូនដំណឹង',
    nav_analytics: 'វិភាគទិន្នន័យ',
    nav_my_fields: 'ទីលានរបស់ខ្ញុំ',
    nav_booking_requests: 'សំណើកក់',
    action_logout: 'ចាកចេញ',
    action_go_dashboard: 'ទៅផ្ទាំងគ្រប់គ្រង',
    workspace_player: 'ផ្ទាំងអ្នកលេង និងកាពីតែន',
    workspace_owner: 'ផ្ទាំងម្ចាស់ទីលាន',
    label_workspace: 'កន្លែងការងារ',
    label_language: 'ភាសា'
  }
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en');

  const changeLanguage = (nextLanguage) => {
    const safe = nextLanguage === 'km' ? 'km' : 'en';
    setLanguage(safe);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, safe);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage: changeLanguage,
      t: (key, fallback) => translations[language]?.[key] || fallback || key
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
