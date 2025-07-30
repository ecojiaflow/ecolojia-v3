import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('fr') ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center px-3 py-2 rounded-full bg-white/80 hover:bg-white transition-colors text-eco-text"
      aria-label={i18n.language.startsWith('fr') ? 'Switch to English' : 'Passer en français'}
    >
      <Languages size={18} className="mr-2" />
      <span className="font-medium">{i18n.language.startsWith('fr') ? 'FR' : 'EN'}</span>
    </button>
  );
};

export default LanguageSelector;