// PATH: frontend/src/pages/AboutPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Heart, Shield, Target, Users, Lightbulb, Award, Globe } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#E9F8DF] to-[#F7F9F4] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <Link to="/" className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <Leaf className="h-12 w-12 text-primary" />
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-800 mb-6">
            ? propos d'ECOLOJIA
          </h1>
          <p className="text-xl text-neutral-800/80 max-w-3xl mx-auto leading-relaxed">
            Votre assistant IA pour une consommation eclairee et responsable. 
            Analysez vos produits, comprenez leur impact et faites des choix conscients.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 mt-6 text-primary hover:text-neutral-800 transition-colors text-sm"
          >
            aaa Retour  l'accueil
          </Link>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-neutral-800 mb-6 flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                Notre Mission
              </h2>
              <div className="space-y-4 text-neutral-800/80 text-lg leading-relaxed">
                <p>
                  <strong className="text-neutral-800">Democratiser l'acces  une information fiable</strong> sur tous les produits du quotidien.
                </p>
                <p>
                  Nous croyons que chaque consommateur ? le droit de savoir ce qu'il achete et consomme. ECOLOJIA rend cette information accessible  tous.
                </p>
                <p>
                  Grace  notre intelligence artificielle avancee, nous analysons instantanement les produits alimentaires, cosmetiques et menagers selon des criteres scientifiques reconnus.
                </p>
              </div>
            </div>
            
            <div className="bg-primary/5 p-8 rounded-2xl border border-primary/20">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800 mb-2">Scannez ou recherchez</h3>
                    <p className="text-neutral-800/70">Utilisez notre scanner, prenez une photo ou recherchez manuellement</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800 mb-2">Analyse instantanee</h3>
                    <p className="text-neutral-800/70">Notre IA calcule les scores Santé, environnement et ethique</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800 mb-2">Alternatives saines</h3>
                    <p className="text-neutral-800/70">Decouvrez des produits similaires avec de meilleurs scores</p>
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
            <h2 className="text-3xl font-bold text-neutral-800 mb-4">
              Nos Valeurs
            </h2>
            <p className="text-neutral-800/70 text-lg max-w-2xl mx-auto">
              Les principes qui guident notre mission au quotidien
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Transparence</h3>
              <p className="text-neutral-800/70">
                Sources verifiees et methodologie claire pour chaque analyse
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Responsabilite</h3>
              <p className="text-neutral-800/70">
                Engagement pour votre Santé et celle de la planete
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Innovation</h3>
              <p className="text-neutral-800/70">
                IA de pointe pour des analyses toujours plus precises
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Simplicite</h3>
              <p className="text-neutral-800/70">
                Interface intuitive accessible  tous
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-800 mb-4 flex items-center justify-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              Notre Technologie
            </h2>
            <p className="text-neutral-800/70 text-lg max-w-2xl mx-auto">
              Une combinaison unique d'intelligence artificielle et de donnees scientifiques
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-primary/10">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">aaa</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">IA Proprietaire</h3>
              <p className="text-neutral-800/70">
                Algorithmes NOVA V2, INCI V2 et ECO V2 developpes specifiquement pour chaque categorie
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-primary/10">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">a</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Analyse Temps Reel</h3>
              <p className="text-neutral-800/70">
                Enrichissement automatique et calculéinstantane des scores en moins de 2 secondes
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-primary/10">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">aaaaa</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Donnees Securisees</h3>
              <p className="text-neutral-800/70">
                Respect total de votre vie privee avec chiffrement de bout en bout
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-br from-[#E9F8DF] to-[#F7F9F4]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Globe className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-neutral-800 mb-6">
            Contactez-nous
          </h2>
          <p className="text-neutral-800/80 text-lg mb-8 max-w-2xl mx-auto">
            Une question, une suggestion ou envie de collaborer ? 
            Notre equipe est  votre ecoute
          </p>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/80 px-6 py-3 rounded-full text-neutral-800">
              <span className="text-primary">aaaa</span>
              <span className="font-medium">contact@ecoloji?.app</span>
            </div>
            <p className="text-neutral-800/60 text-sm">
              Nous repondons sous 48h ouvrees
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;


