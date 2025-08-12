// PATH: frontend/src/pages/TermsPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, AlertTriangle, Scale, Clock, Mail } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header avec lien retour */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center justify-center mb-6 hover:scale-105 transition-transform">
            <FileText className="h-16 w-16 text-[#7DDE4A]" />
          </Link>
          <h1 className="text-4xl font-bold text-[#3B3B3B] mb-4">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-[#3B3B3B]/70 text-lg">
            Dernière mise ÃƒÂ  jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 mt-4 text-[#7DDE4A] hover:text-[#3B3B3B] transition-colors text-sm"
          >
            ââ€ Â Retour ÃƒÂ  l'accueil
          </Link>
        </div>

        <div className="prose prose-lg max-w-none text-[#3B3B3B]/80">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-[#7DDE4A]" />
              1. Objet
            </h2>
            <p className="text-[#3B3B3B]/70 mb-4">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation du service ECOLOJIA, 
              plateforme d'analyse de produits alimentaires, cosmétiques et ménagers.
            </p>
            <p className="text-[#3B3B3B]/70">
              En utilisant ECOLOJIA, vous acceptez sans réserve les présentes CGU. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Scale className="h-6 w-6 text-[#7DDE4A]" />
              2. Description du service
            </h2>
            <div className="bg-[#7DDE4A]/5 p-6 rounded-xl mb-6 border border-[#7DDE4A]/20">
              <h3 className="text-lg font-semibold text-[#3B3B3B] mb-3">ECOLOJIA propose :</h3>
              <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
                <li>L'analyse instantanée de produits via scan, photo ou recherche manuelle</li>
                <li>Des scores de santé, environnement et éthique basés sur des critères scientifiques</li>
                <li>Des recommandations d'alternatives plus saines</li>
                <li>Un assistant IA pour répondre ÃƒÂ  vos questions nutritionnelles</li>
                <li>Un tableau de bord personnalisé pour suivre vos habitudes</li>
              </ul>
            </div>
            <p className="text-[#3B3B3B]/70">
              Nos analyses sont basées sur des algorithmes propriétaires et des sources scientifiques reconnues 
              (INSERM, ANSES, EFSA). Cependant, elles ne remplacent pas l'avis d'un professionnel de santé.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-[#7DDE4A]" />
              3. Conditions d'utilisation
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#3B3B3B]">Vous vous engagez ÃƒÂ  :</h3>
              <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
                <li>Fournir des informations exactes lors de votre inscription</li>
                <li>Utiliser le service de manière responsable et légale</li>
                <li>Ne pas tenter d'extraire ou copier massivement nos données</li>
                <li>Respecter les droits de propriété intellectuelle</li>
                <li>Ne pas diffuser de contenu inapproprié via nos services</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-[#3B3B3B] mt-6">Il est interdit de :</h3>
              <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
                <li>Utiliser des robots ou scripts automatisés sans autorisation</li>
                <li>Tenter d'accéder aux systèmes informatiques d'ECOLOJIA</li>
                <li>Reproduire ou redistribuer nos analyses sans autorisation</li>
                <li>Utiliser le service ÃƒÂ  des fins commerciales sans accord préalable</li>
                <li>Usurper l'identité d'une autre personne</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-[#7DDE4A]" />
              4. Disponibilité du service
            </h2>
            <p className="text-[#3B3B3B]/70 mb-4">
              Nous nous efforçons de maintenir ECOLOJIA disponible 24h/24, 7j/7. 
              Cependant, nous ne garantissons pas une disponibilité ininterrompue du service.
            </p>
            <p className="text-[#3B3B3B]/70">
              Nous nous réservons le droit de suspendre temporairement l'accès pour maintenance, 
              mise ÃƒÂ  jour ou en cas de force majeure, sans préavis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4">
              5. Propriété intellectuelle
            </h2>
            <p className="text-[#3B3B3B]/70 mb-4">
              Tous les contenus présents sur ECOLOJIA (textes, images, logos, bases de données, algorithmes) 
              sont protégés par le droit de la propriété intellectuelle et appartiennent ÃƒÂ  ECOLOJIA ou ses partenaires.
            </p>
            <p className="text-[#3B3B3B]/70">
              Toute reproduction, représentation ou exploitation non autorisée est interdite et 
              peut donner lieu ÃƒÂ  des poursuites judiciaires.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4">
              6. Limitation de responsabilité
            </h2>
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <p className="text-[#3B3B3B]/70 mb-4">
                <strong>Important :</strong> Les informations fournies par ECOLOJIA sont ÃƒÂ  titre informatif uniquement.
              </p>
              <p className="text-[#3B3B3B]/70">
                ECOLOJIA ne saurait être tenu responsable des décisions prises sur la base de nos analyses. 
                Pour tout problème de santé ou régime spécifique, consultez un professionnel qualifié.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6 text-[#7DDE4A]" />
              7. Contact
            </h2>
            <div className="bg-[#7DDE4A]/5 p-6 rounded-xl border border-[#7DDE4A]/20">
              <p className="text-[#3B3B3B]/70 mb-4">
                Pour toute question concernant ces CGU :
              </p>
              <div className="space-y-2 text-[#3B3B3B]/70">
                <p><strong>Email :</strong> legal@ecolojia.app</p>
                <p><strong>Support :</strong> support@ecolojia.app</p>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4">
              8. Droit applicable
            </h2>
            <p className="text-[#3B3B3B]/70">
              Les présentes CGU sont régies par le droit français. 
              Tout litige relatif ÃƒÂ  leur interprétation ou exécution relève de la compétence 
              exclusive des tribunaux français.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
