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
              <Leaf className="h-12 w-12 text-[#7DDE4A]" />
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#3B3B3B] mb-6">
            ÃƒÆ’Ã†â€™Ã¢â€šÂ¬ propos d'ECOLOJIA
          </h1>
          <p className="text-xl text-[#3B3B3B]/80 max-w-3xl mx-auto leading-relaxed">
            Votre assistant IA pour une consommation Ã©clairÃ©e et responsable. 
            Analysez vos produits, comprenez leur impact et faites des choix conscients.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 mt-6 text-[#7DDE4A] hover:text-[#3B3B3B] transition-colors text-sm"
          >
            Ã¢Ã¢Ã¢â€šÂ¬Ã‚Â Ãƒâ€šÃ‚Â Retour ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  l'accueil
          </Link>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#3B3B3B] mb-6 flex items-center gap-3">
                <Target className="h-8 w-8 text-[#7DDE4A]" />
                Notre Mission
              </h2>
              <div className="space-y-4 text-[#3B3B3B]/80 text-lg leading-relaxed">
                <p>
                  <strong className="text-[#3B3B3B]">DÃ©mocratiser l'accÃ¨s ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  une information fiable</strong> sur tous les produits du quotidien.
                </p>
                <p>
                  Nous croyons que chaque consommateur a le droit de savoir ce qu'il achÃ¨te et consomme. ECOLOJIA rend cette information accessible ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tous.
                </p>
                <p>
                  GrÃ¢ce ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  notre intelligence artificielle avancÃ©e, nous analysons instantanÃ©ment les produits alimentaires, cosmÃ©tiques et mÃ©nagers selon des critÃ¨res scientifiques reconnus.
                </p>
              </div>
            </div>
            
            <div className="bg-[#7DDE4A]/5 p-8 rounded-2xl border border-[#7DDE4A]/20">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#7DDE4A] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#3B3B3B] mb-2">Scannez ou recherchez</h3>
                    <p className="text-[#3B3B3B]/70">Utilisez notre scanner, prenez une photo ou recherchez manuellement</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#7DDE4A] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#3B3B3B] mb-2">Analyse instantanÃ©e</h3>
                    <p className="text-[#3B3B3B]/70">Notre IA calcule les scores santÃ©, environnement et Ã©thique</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#7DDE4A] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#3B3B3B] mb-2">Alternatives saines</h3>
                    <p className="text-[#3B3B3B]/70">DÃ©couvrez des produits similaires avec de meilleurs scores</p>
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
            <h2 className="text-3xl font-bold text-[#3B3B3B] mb-4">
              Nos Valeurs
            </h2>
            <p className="text-[#3B3B3B]/70 text-lg max-w-2xl mx-auto">
              Les principes qui guident notre mission au quotidien
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#7DDE4A] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#3B3B3B] mb-3">Transparence</h3>
              <p className="text-[#3B3B3B]/70">
                Sources vÃ©rifiÃ©es et mÃ©thodologie claire pour chaque analyse
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#7DDE4A] rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#3B3B3B] mb-3">ResponsabilitÃ©</h3>
              <p className="text-[#3B3B3B]/70">
                Engagement pour votre santÃ© et celle de la planÃ¨te
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#7DDE4A] rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#3B3B3B] mb-3">Innovation</h3>
              <p className="text-[#3B3B3B]/70">
                IA de pointe pour des analyses toujours plus prÃ©cises
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#7DDE4A] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#3B3B3B] mb-3">SimplicitÃ©</h3>
              <p className="text-[#3B3B3B]/70">
                Interface intuitive accessible ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tous
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#3B3B3B] mb-4 flex items-center justify-center gap-3">
              <Award className="h-8 w-8 text-[#7DDE4A]" />
              Notre Technologie
            </h2>
            <p className="text-[#3B3B3B]/70 text-lg max-w-2xl mx-auto">
              Une combinaison unique d'intelligence artificielle et de donnÃ©es scientifiques
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#7DDE4A]/10">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¤Ã¢Ã¢â€šÂ¬Ã¢â‚¬Å“</span>
              </div>
              <h3 className="text-xl font-semibold text-[#3B3B3B] mb-3">IA PropriÃ©taire</h3>
              <p className="text-[#3B3B3B]/70">
                Algorithmes NOVA V2, INCI V2 et ECO V2 dÃ©veloppÃ©s spÃ©cifiquement pour chaque catÃ©gorie
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#7DDE4A]/10">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">Ã¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â¡</span>
              </div>
              <h3 className="text-xl font-semibold text-[#3B3B3B] mb-3">Analyse Temps RÃ©el</h3>
              <p className="text-[#3B3B3B]/70">
                Enrichissement automatique et calcul instantanÃ© des scores en moins de 2 secondes
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#7DDE4A]/10">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃ¢Ã¢â€šÂ¬Ã¢â€žÂ¢</span>
              </div>
              <h3 className="text-xl font-semibold text-[#3B3B3B] mb-3">DonnÃ©es SÃ©curisÃ©es</h3>
              <p className="text-[#3B3B3B]/70">
                Respect total de votre vie privÃ©e avec chiffrement de bout en bout
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-br from-[#E9F8DF] to-[#F7F9F4]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Globe className="h-12 w-12 text-[#7DDE4A]" />
          </div>
          <h2 className="text-3xl font-bold text-[#3B3B3B] mb-6">
            Contactez-nous
          </h2>
          <p className="text-[#3B3B3B]/80 text-lg mb-8 max-w-2xl mx-auto">
            Une question, une suggestion ou envie de collaborer ? 
            Notre Ã©quipe est ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  votre Ã©coute
          </p>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/80 px-6 py-3 rounded-full text-[#3B3B3B]">
              <span className="text-[#7DDE4A]">Ã¢Ãƒâ€¦Ã¢â‚¬Å“Ã¢Ã¢â€šÂ¬Ã‚Â°ÃƒÂ¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â</span>
              <span className="font-medium">contact@ecolojia.app</span>
            </div>
            <p className="text-[#3B3B3B]/60 text-sm">
              Nous rÃ©pondons sous 48h ouvrÃ©es
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

