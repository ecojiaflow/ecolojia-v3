import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Logo et description */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center mb-4 hover:opacity-80 transition-opacity">
              <Leaf className="h-8 w-8 text-eco-leaf" />
              <span className="ml-2 text-xl font-semibold text-eco-text">ECOLOJIA</span>
            </Link>
            <p className="text-eco-text/70 text-sm leading-relaxed mb-4">
              {t('footer.description')}
            </p>
            <div className="flex items-center space-x-4 text-eco-text/60">
              <span className="text-xs">F</span>
              <span className="text-xs">T</span>
              <span className="text-xs">I</span>
              <span className="text-xs">L</span>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-sm font-semibold text-eco-text mb-4 uppercase tracking-wider">
              {t('footer.quickLinks')}
            </h3>
            <div className="space-y-3">
              <Link to="/" className="block text-eco-text/70 hover:text-eco-leaf transition-colors text-sm">
                {t('common.home')}
              </Link>
              <span className="block text-gray-400 text-sm cursor-not-allowed">
                {t('common.products')}
              </span>
              <span className="block text-gray-400 text-sm cursor-not-allowed">
                {t('common.categories')}
              </span>
              <Link to="/about" className="block text-eco-text/70 hover:text-eco-leaf transition-colors text-sm">
                {t('common.about')}
              </Link>
              <span className="block text-gray-400 text-sm cursor-not-allowed">
                {t('common.blog')}
              </span>
            </div>
          </div>

          {/* Mentions légales */}
          <div>
            <h3 className="text-sm font-semibold text-eco-text mb-4 uppercase tracking-wider">
              {t('footer.legal')}
            </h3>
            <div className="space-y-3">
              <Link to="/terms" className="block text-eco-text/70 hover:text-eco-leaf transition-colors text-sm">
                {t('footer.terms')}
              </Link>
              <Link to="/privacy" className="block text-eco-text/70 hover:text-eco-leaf transition-colors text-sm">
                {t('footer.privacy')}
              </Link>
              <span className="block text-gray-400 text-sm cursor-not-allowed">
                {t('footer.cookies')}
              </span>
              <Link to="/legal" className="block text-eco-text/70 hover:text-eco-leaf transition-colors text-sm">
                {t('footer.legalNotice')}
              </Link>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-eco-text mb-4 uppercase tracking-wider">
              {t('footer.newsletter')}
            </h3>
            <p className="text-eco-text/70 text-sm mb-4">
              {t('footer.newsletterDescription')}
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-leaf/30 focus:border-eco-leaf"
              />
              <button className="px-4 py-2 bg-eco-leaf text-white rounded-r-lg hover:bg-eco-leaf/90 transition-colors">
                <span className="text-sm">📧</span>
              </button>
            </div>
            <p className="text-xs text-eco-text/50 mt-2">
              {t('footer.gdprConsent')}{' '}
              <Link to="/privacy" className="text-eco-leaf hover:underline">
                {t('footer.privacy')}
              </Link>.
            </p>
          </div>
        </div>

        {/* Certifications */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex items-center mb-4">
            <span className="text-sm font-medium text-eco-text mr-4">🏆 {t('footer.certifications')}</span>
          </div>
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full border border-yellow-200">
              AB Agriculture Biologique
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
              Ecocert
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200">
              FSC
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200">
              Cruelty Free
            </span>
            <span className="px-3 py-1 bg-eco-leaf/10 text-eco-leaf text-xs rounded-full border border-eco-leaf/20">
              1% for the Planet
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-eco-text/60 text-sm">
              © 2025 Ecolojia. {t('footer.allRights')}
            </p>
            <div className="flex items-center mt-4 md:mt-0">
              <Heart className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-eco-text/60 text-sm">{t('footer.madeWith')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;