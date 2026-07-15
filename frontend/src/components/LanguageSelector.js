import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGES } from '../utils/translations';
import './LanguageSelector.css';

export default function LanguageSelector({ darkMode = false }) {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === language);

  return (
    <div className="lang-selector-wrapper">
      <button 
        className={`lang-selector-btn ${darkMode ? 'dark' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe size={18} />
        <span className="lang-current">{currentLang?.flag}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              className="lang-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className={`lang-dropdown ${darkMode ? 'dark' : ''}`}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  className={`lang-option ${language === lang.code ? 'active' : ''}`}
                  onClick={() => {
                    changeLanguage(lang.code);
                    setIsOpen(false);
                  }}
                >
                  <span className="lang-flag">{lang.flag}</span>
                  <span className="lang-name">{lang.name}</span>
                  {language === lang.code && <span className="lang-check">✓</span>}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
