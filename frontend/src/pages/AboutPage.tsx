import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Heart, Shield, Target, Users, Lightbulb, Award, Globe } from 'lucide-react';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="bg-eco-gradient py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <Link to="/" className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <Leaf className="h-12 w-12 text-eco-leaf" />
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-eco-text mb-6">
            {t('about.title')}
          </h1>
          <p className="text-xl text-eco-text/80 max-w-3xl mx-auto leading-relaxed">
            {t('about.subtitle')}
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 mt-6 text-eco-leaf hover:text-eco-text transition-colors text-sm"
          >
            {t('common.backToHome')}
          </Link>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-eco-text mb-6 flex items-center gap-3">
                <Target className="h-8 w-8 text-eco-leaf" />
                {t('about.mission.title')}
              </h2>
              <div className="space-y-4 text-eco-text/80 text-lg leading-relaxed">
                <p>
                  <strong className="text-eco-text">{t('about.mission.content.main')}</strong>
                </p>
                <p>
                  {t('about.mission.content.belief')}
                </p>
                <p>
                  {t('about.mission.content.ai')}
                </p>
              </div>
            </div>
            
            <div className="bg-eco-leaf/5 p-8 rounded-2xl border border-eco-leaf/20">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-eco-leaf rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-eco-text mb-2">{t('about.mission.steps.search.title')}</h3>
                    <p className="text-eco-text/70">{t('about.mission.steps.search.description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-eco-leaf rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-eco-text mb-2">{t('about.mission.steps.scores.title')}</h3>
                    <p className="text-eco-text/70">{t('about.mission.steps.scores.description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-eco-leaf rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-eco-text mb-2">{t('about.mission.steps.partners.title')}</h3>
                    <p className="text-eco-text/70">{t('about.mission.steps.partners.description')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-eco-text mb-4">
              {t('about.values.title')}
            </h2>
            <p className="text-eco-text/70 text-lg max-w-2xl mx-auto">
              {t('about.values.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-eco-leaf rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-eco-text mb-3">{t('about.values.transparency.title')}</h3>
              <p className="text-eco-text/70">
                {t('about.values.transparency.description')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-eco-leaf rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-eco-text mb-3">{t('about.values.responsibility.title')}</h3>
              <p className="text-eco-text/70">
                {t('about.values.responsibility.description')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-eco-leaf rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-eco-text mb-3">{t('about.values.innovation.title')}</h3>
              <p className="text-eco-text/70">
                {t('about.values.innovation.description')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-eco-leaf rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-eco-text mb-3">{t('about.values.simplicity.title')}</h3>
              <p className="text-eco-text/70">
                {t('about.values.simplicity.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-eco-text mb-4 flex items-center justify-center gap-3">
              <Award className="h-8 w-8 text-eco-leaf" />
              {t('about.technology.title')}
            </h2>
            <p className="text-eco-text/70 text-lg max-w-2xl mx-auto">
              {t('about.technology.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-eco-leaf/10">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-eco-text mb-3">{t('about.technology.ai.title')}</h3>
              <p className="text-eco-text/70">
                {t('about.technology.ai.description')}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-eco-leaf/10">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-eco-text mb-3">{t('about.technology.search.title')}</h3>
              <p className="text-eco-text/70">
                {t('about.technology.search.description')}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-eco-leaf/10">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-eco-text mb-3">{t('about.technology.privacy.title')}</h3>
              <p className="text-eco-text/70">
                {t('about.technology.privacy.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-eco-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Globe className="h-12 w-12 text-eco-leaf" />
          </div>
          <h2 className="text-3xl font-bold text-eco-text mb-6">
            {t('about.contact.title')}
          </h2>
          <p className="text-eco-text/80 text-lg mb-8 max-w-2xl mx-auto">
            {t('about.contact.subtitle')}
          </p>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/80 px-6 py-3 rounded-full text-eco-text">
              <span className="text-eco-leaf">✉️</span>
              <span className="font-medium">{t('about.contact.email')}</span>
            </div>
            <p className="text-eco-text/60 text-sm">
              {t('about.contact.response')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;