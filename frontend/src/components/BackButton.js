import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './BackButton.css';

export default function BackButton({ 
  to = null, 
  darkMode = false, 
  floating = false,
  className = '',
  label = null 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const handleBack = () => {
    if (to) {
      navigate(to, { replace: true });
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Default fallback to home
      navigate('/', { replace: true });
    }
  };

  // Don't show back button on home page
  if (location.pathname === '/') {
    return null;
  }

  const buttonClasses = `back-button ${darkMode ? 'dark' : ''} ${floating ? 'back-button-floating' : ''} ${className}`;

  return (
    <button className={buttonClasses} onClick={handleBack}>
      <span className="back-button-icon">
        <ArrowLeft size={18} />
      </span>
      <span>{label || t('back') || 'Back'}</span>
    </button>
  );
}
