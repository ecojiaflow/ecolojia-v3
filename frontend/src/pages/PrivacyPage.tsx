import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Shield, Eye, Lock, Mail, FileText } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header avec lien retour */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center justify-center mb-6 hover:scale-105 transition-transform">
            <Shield className="h-16 w-16 text-eco-leaf" />
          </Link>
          <h1 className="text-4xl font-bold text-eco-text mb-4">
            {t('privacy.title')}
          </h1>
          <p className="text-eco-text/70 text-lg">
            {t('privacy.lastUpdated')} : {new Date().toLocaleDateString('fr-FR')}
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 mt-4 text-eco-leaf hover:text-eco-text transition-colors text-sm"
          >
            {t('common.backToHome')}
          </Link>
        </div>

        {/* Contenu */}
        <div className="prose prose-lg max-w-none text-eco-text/80">
          
          <div className="bg-eco-leaf/5 p-6 rounded-xl mb-8 border border-eco-leaf/20">
            <div className="flex items-start gap-3">
              <Leaf className="h-6 w-6 text-eco-leaf mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-eco-text mb-2">
                  {t('privacy.commitment.title')}
                </h3>
                <p className="text-eco-text/70">
                  {t('privacy.commitment.description')}
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6 text-eco-leaf" />
              {t('privacy.dataCollected.title')}
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-eco-text">{t('privacy.dataCollected.automatic.title')}</h3>
              <ul className="list-disc list-inside space-y-2 text-eco-text/70">
                {t('privacy.dataCollected.automatic.items', { returnObjects: true }).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              
              <h3 className="text-xl font-semibold text-eco-text mt-6">{t('privacy.dataCollected.voluntary.title')}</h3>
              <ul className="list-disc list-inside space-y-2 text-eco-text/70">
                {t('privacy.dataCollected.voluntary.items', { returnObjects: true }).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-eco-leaf" />
              {t('privacy.dataUsage.title')}
            </h2>
            <p className="text-eco-text/70 mb-4">{t('privacy.dataUsage.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-eco-text/70">
              {t('privacy.dataUsage.items', { returnObjects: true }).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-eco-leaf" />
              {t('privacy.cookies.title')}
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-eco-text mb-2">{t('privacy.cookies.essential.title')}</h3>
                <p className="text-eco-text/70">{t('privacy.cookies.essential.description')}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-eco-text mb-2">{t('privacy.cookies.analytics.title')}</h3>
                <p className="text-eco-text/70">
                  {t('privacy.cookies.analytics.description')}
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-eco-leaf" />
              {t('privacy.rights.title')}
            </h2>
            <p className="text-eco-text/70 mb-4">{t('privacy.rights.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-eco-text/70">
              {t('privacy.rights.items', { returnObjects: true }).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6 text-eco-leaf" />
              {t('privacy.contact.title')}
            </h2>
            <div className="bg-eco-leaf/5 p-6 rounded-xl border border-eco-leaf/20">
              <p className="text-eco-text/70 mb-4">
                {t('privacy.contact.description')}
              </p>
              <div className="space-y-2 text-eco-text/70">
                <p><strong>{t('privacy.contact.email')}</strong></p>
                <p><strong>{t('privacy.contact.dpo')}</strong></p>
                <p><strong>{t('privacy.contact.response')}</strong></p>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-eco-text mb-4">
              {t('privacy.changes.title')}
            </h2>
            <p className="text-eco-text/70">
              {t('privacy.changes.description')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;