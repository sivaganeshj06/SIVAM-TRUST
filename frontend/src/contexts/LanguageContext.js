import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, getCurrentLanguage, setCurrentLanguage } from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getCurrentLanguage());

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  const t = React.useCallback((key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  }, [language]);

  const changeLanguage = React.useCallback((lang) => {
    setLanguage(lang);
    setCurrentLanguage(lang);
    // Force page refresh to ensure all components re-render with new language
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, []);

  const value = React.useMemo(() => ({
    language,
    t,
    changeLanguage
  }), [language, t, changeLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
