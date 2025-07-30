import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building, Mail, Globe, Calendar } from 'lucide-react';

const LegalPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header avec lien retour */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center justify-center mb-6 hover:scale-105 transition-transform">
            <Building className="h-16 w-16 text-eco-leaf" />
          </Link>
          <h1 className="text-4xl font-bold text-eco-text mb-4">
            {t('legal.title')}
          </h1>
          <p className="text-eco-text/70 text-lg">
            {t('legal.subtitle')}
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 mt-4 text-eco-leaf hover:text-eco-text transition-colors text-sm"
          >
            {t('common.backToHome')}
          </Link>
        </div>

        <div className="prose prose-lg max-w-none text-eco-text/80">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-6 flex items-center gap-2">
              <Building className="h-6 w-6 text-eco-leaf" />
              {t('legal.editor.title')}
            </h2>
            
            <div className="bg-eco-leaf/5 p-6 rounded-xl border border-eco-leaf/20">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-eco-text mb-3">{t('legal.editor.company.title')}</h3>
                  <div className="space-y-2 text-eco-text/70">
                    <p><strong>{t('legal.editor.company.name')}</strong></p>
                    <p><strong>{t('legal.editor.company.form')}</strong></p>
                    <p><strong>{t('legal.editor.company.status')}</strong></p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-eco-text mb-3">{t('legal.editor.contact.title')}</h3>
                  <div className="space-y-3 text-eco-text/70">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-eco-leaf" />
                      <p>{t('legal.editor.contact.email')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4">
              {t('legal.director.title')}
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-eco-text/70">
                <strong>{t('legal.director.contact')}</strong>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4 flex items-center gap-2">
              <Globe className="h-6 w-6 text-eco-leaf" />
              {t('legal.hosting.title')}
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-eco-text mb-2">{t('legal.hosting.frontend.title')}</h3>
                <p className="text-eco-text/70">
                  <strong>{t('legal.hosting.frontend.host')}</strong><br />
                  <strong>{t('legal.hosting.frontend.address')}</strong><br />
                  <strong>{t('legal.hosting.frontend.website')}</strong>
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-eco-text mb-2">{t('legal.hosting.backend.title')}</h3>
                <p className="text-eco-text/70">
                  <strong>{t('legal.hosting.backend.host')}</strong><br />
                  <strong>{t('legal.hosting.backend.address')}</strong><br />
                  <strong>{t('legal.hosting.backend.website')}</strong>
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4">
              {t('legal.intellectual.title')}
            </h2>
            <div className="space-y-4 text-eco-text/70">
              <p>
                {t('legal.intellectual.description1')}
              </p>
              <p>
                {t('legal.intellectual.description2')}
              </p>
              <p>
                {t('legal.intellectual.description3')}
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4">
              {t('legal.data.title')}
            </h2>
            <p className="text-eco-text/70 mb-4">
              {t('legal.data.description')} <Link to="/privacy" className="text-eco-leaf hover:underline">{t('legal.data.link')}</Link>.
            </p>
            <div className="bg-eco-leaf/5 p-4 rounded-lg border border-eco-leaf/20">
              <p className="text-eco-text/70">
                <strong>{t('legal.data.dpo')}</strong>
              </p>
            </div>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-6 w-6 text-eco-leaf" />
              <h2 className="text-2xl font-bold text-eco-text">
                {t('legal.update.title')}
              </h2>
            </div>
            <p className="text-eco-text/70">
              {t('legal.update.description', { date: new Date().toLocaleDateString('fr-FR') })}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;