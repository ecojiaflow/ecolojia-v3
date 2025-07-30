import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Users, AlertTriangle, Scale, Clock, Mail } from 'lucide-react';

const TermsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header avec lien retour */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center justify-center mb-6 hover:scale-105 transition-transform">
            <FileText className="h-16 w-16 text-eco-leaf" />
          </Link>
          <h1 className="text-4xl font-bold text-eco-text mb-4">
            {t('terms.title')}
          </h1>
          <p className="text-eco-text/70 text-lg">
            {t('terms.lastUpdated')} : {new Date().toLocaleDateString('fr-FR')}
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
            <h2 className="text-2xl font-bold text-eco-text mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-eco-leaf" />
              {t('terms.object.title')}
            </h2>
            <p className="text-eco-text/70 mb-4">
              {t('terms.object.description1')}
            </p>
            <p className="text-eco-text/70">
              {t('terms.object.description2')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4 flex items-center gap-2">
              <Scale className="h-6 w-6 text-eco-leaf" />
              {t('terms.service.title')}
            </h2>
            <div className="bg-eco-leaf/5 p-6 rounded-xl mb-6 border border-eco-leaf/20">
              <h3 className="text-lg font-semibold text-eco-text mb-3">{t('terms.service.subtitle')}</h3>
              <ul className="list-disc list-inside space-y-2 text-eco-text/70">
                {t('terms.service.items', { returnObjects: true }).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <p className="text-eco-text/70">
              {t('terms.service.description')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-eco-leaf" />
              {t('terms.usage.title')}
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-eco-text">{t('terms.usage.commit.title')}</h3>
              <ul className="list-disc list-inside space-y-2 text-eco-text/70">
                {t('terms.usage.commit.items', { returnObjects: true }).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              
              <h3 className="text-xl font-semibold text-eco-text mt-6">{t('terms.usage.forbidden.title')}</h3>
              <ul className="list-disc list-inside space-y-2 text-eco-text/70">
                {t('terms.usage.forbidden.items', { returnObjects: true }).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-eco-leaf" />
              {t('terms.availability.title')}
            </h2>
            <p className="text-eco-text/70 mb-4">
              {t('terms.availability.description1')}
            </p>
            <p className="text-eco-text/70">
              {t('terms.availability.description2')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4">
              {t('terms.intellectual.title')}
            </h2>
            <p className="text-eco-text/70 mb-4">
              {t('terms.intellectual.description1')}
            </p>
            <p className="text-eco-text/70">
              {t('terms.intellectual.description2')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4">
              {t('terms.liability.title')}
            </h2>
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <p className="text-eco-text/70 mb-4">
                <strong>{t('terms.liability.warning')}</strong>
              </p>
              <p className="text-eco-text/70">
                {t('terms.liability.description')}
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6 text-eco-leaf" />
              {t('terms.contact.title')}
            </h2>
            <div className="bg-eco-leaf/5 p-6 rounded-xl border border-eco-leaf/20">
              <p className="text-eco-text/70 mb-4">
                {t('terms.contact.description')}
              </p>
              <div className="space-y-2 text-eco-text/70">
                <p><strong>{t('terms.contact.email')}</strong></p>
                <p><strong>{t('terms.contact.support')}</strong></p>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4">
              {t('terms.law.title')}
            </h2>
            <p className="text-eco-text/70">
              {t('terms.law.description')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;