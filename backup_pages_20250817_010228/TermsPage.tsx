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
            Conditions GÃ©nÃ©rales d'Utilisation
          </h1>
          <p className="text-[#3B3B3B]/70 text-lg">
            DerniÃ¨re mise ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 mt-4 text-[#7DDE4A] hover:text-[#3B3B3B] transition-colors text-sm"
          >
            Ã¢Ã¢Ã¢â€šÂ¬Ã‚Â Ãƒâ€šÃ‚Â Retour ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  l'accueil
          </Link>
        </div>

        <div className="prose prose-lg max-w-none text-[#3B3B3B]/80">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-[#7DDE4A]" />
              1. Objet
            </h2>
            <p className="text-[#3B3B3B]/70 mb-4">
              Les prÃ©sentes Conditions GÃ©nÃ©rales d'Utilisation (CGU) rÃ©gissent l'utilisation du service ECOLOJIA, 
              plateforme d'analyse de produits alimentaires, cosmÃ©tiques et mÃ©nagers.
            </p>
            <p className="text-[#3B3B3B]/70">
              En utilisant ECOLOJIA, vous acceptez sans rÃ©serve les prÃ©sentes CGU. 
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
                <li>L'analyse instantanÃ©e de produits via scan, photo ou recherche manuelle</li>
                <li>Des scores de santÃ©, environnement et Ã©thique basÃ©s sur des critÃ¨res scientifiques</li>
                <li>Des recommandations d'alternatives plus saines</li>
                <li>Un assistant IA pour rÃ©pondre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  vos questions nutritionnelles</li>
                <li>Un tableau de bord personnalisÃ© pour suivre vos habitudes</li>
              </ul>
            </div>
            <p className="text-[#3B3B3B]/70">
              Nos analyses sont basÃ©es sur des algorithmes propriÃ©taires et des sources scientifiques reconnues 
              (INSERM, ANSES, EFSA). Cependant, elles ne remplacent pas l'avis d'un professionnel de santÃ©.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-[#7DDE4A]" />
              3. Conditions d'utilisation
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#3B3B3B]">Vous vous engagez ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  :</h3>
              <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
                <li>Fournir des informations exactes lors de votre inscription</li>
                <li>Utiliser le service de maniÃ¨re responsable et lÃ©gale</li>
                <li>Ne pas tenter d'extraire ou copier massivement nos donnÃ©es</li>
                <li>Respecter les droits de propriÃ©tÃ© intellectuelle</li>
                <li>Ne pas diffuser de contenu inappropriÃ© via nos services</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-[#3B3B3B] mt-6">Il est interdit de :</h3>
              <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
                <li>Utiliser des robots ou scripts automatisÃ©s sans autorisation</li>
                <li>Tenter d'accÃ©der aux systÃ¨mes informatiques d'ECOLOJIA</li>
                <li>Reproduire ou redistribuer nos analyses sans autorisation</li>
                <li>Utiliser le service ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  des fins commerciales sans accord prÃ©alable</li>
                <li>Usurper l'identitÃ© d'une autre personne</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-[#7DDE4A]" />
              4. DisponibilitÃ© du service
            </h2>
            <p className="text-[#3B3B3B]/70 mb-4">
              Nous nous efforÃ§ons de maintenir ECOLOJIA disponible 24h/24, 7j/7. 
              Cependant, nous ne garantissons pas une disponibilitÃ© ininterrompue du service.
            </p>
            <p className="text-[#3B3B3B]/70">
              Nous nous rÃ©servons le droit de suspendre temporairement l'accÃ¨s pour maintenance, 
              mise ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour ou en cas de force majeure, sans prÃ©avis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4">
              5. PropriÃ©tÃ© intellectuelle
            </h2>
            <p className="text-[#3B3B3B]/70 mb-4">
              Tous les contenus prÃ©sents sur ECOLOJIA (textes, images, logos, bases de donnÃ©es, algorithmes) 
              sont protÃ©gÃ©s par le droit de la propriÃ©tÃ© intellectuelle et appartiennent ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  ECOLOJIA ou ses partenaires.
            </p>
            <p className="text-[#3B3B3B]/70">
              Toute reproduction, reprÃ©sentation ou exploitation non autorisÃ©e est interdite et 
              peut donner lieu ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  des poursuites judiciaires.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4">
              6. Limitation de responsabilitÃ©
            </h2>
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <p className="text-[#3B3B3B]/70 mb-4">
                <strong>Important :</strong> Les informations fournies par ECOLOJIA sont ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  titre informatif uniquement.
              </p>
              <p className="text-[#3B3B3B]/70">
                ECOLOJIA ne saurait Ãªtre tenu responsable des dÃ©cisions prises sur la base de nos analyses. 
                Pour tout problÃ¨me de santÃ© ou rÃ©gime spÃ©cifique, consultez un professionnel qualifiÃ©.
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
              Les prÃ©sentes CGU sont rÃ©gies par le droit franÃ§ais. 
              Tout litige relatif ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  leur interprÃ©tation ou exÃ©cution relÃ¨ve de la compÃ©tence 
              exclusive des tribunaux franÃ§ais.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;

