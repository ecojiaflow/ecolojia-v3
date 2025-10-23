// PATH: frontend/src/pages/PrivacyPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Shield, Eye, Lock, Mail, FileText } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header avec lien retour */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center justify-center mb-6 hover:scale-105 transition-transform">
            <Shield className="h-16 w-16 text-[#7DDE4A]" />
          </Link>
          <h1 className="text-4xl font-bold text-[#3B3B3B] mb-4">
            Politique de ConfidentialitÃ©
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

        {/* Contenu */}
        <div className="prose prose-lg max-w-none text-[#3B3B3B]/80">
          
          <div className="bg-[#7DDE4A]/5 p-6 rounded-xl mb-8 border border-[#7DDE4A]/20">
            <div className="flex items-start gap-3">
              <Leaf className="h-6 w-6 text-[#7DDE4A] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-[#3B3B3B] mb-2">
                  Notre engagement
                </h3>
                <p className="text-[#3B3B3B]/70">
                  Chez ECOLOJIA, nous nous engageons ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  protÃ©ger votre vie privÃ©e et vos donnÃ©es personnelles. 
                  Cette politique explique comment nous collectons, utilisons et protÃ©geons vos informations.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6 text-[#7DDE4A]" />
              DonnÃ©es collectÃ©es
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#3B3B3B]">DonnÃ©es collectÃ©es automatiquement</h3>
              <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
                <li>Adresse IP et informations de connexion</li>
                <li>Type d'appareil et systÃ¨me d'exploitation</li>
                <li>Pages visitÃ©es et durÃ©e de visite</li>
                <li>Historique de recherche de produits (anonymisÃ©)</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-[#3B3B3B] mt-6">DonnÃ©es fournies volontairement</h3>
              <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
                <li>Nom et adresse email lors de l'inscription</li>
                <li>PrÃ©fÃ©rences alimentaires et restrictions</li>
                <li>Photos de produits scannÃ©s (supprimÃ©es aprÃ¨s analyse)</li>
                <li>Messages envoyÃ©s via le formulaire de contact</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-[#7DDE4A]" />
              Utilisation des donnÃ©es
            </h2>
            <p className="text-[#3B3B3B]/70 mb-4">Nous utilisons vos donnÃ©es uniquement pour :</p>
            <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
              <li>Fournir et amÃ©liorer nos services d'analyse de produits</li>
              <li>Personnaliser votre expÃ©rience utilisateur</li>
              <li>Vous envoyer des notifications pertinentes (avec votre consentement)</li>
              <li>RÃ©pondre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  vos questions et demandes de support</li>
              <li>AmÃ©liorer nos algorithmes d'analyse</li>
              <li>Respecter nos obligations lÃ©gales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-[#7DDE4A]" />
              Cookies et technologies similaires
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#3B3B3B] mb-2">Cookies essentiels</h3>
                <p className="text-[#3B3B3B]/70">
                  NÃ©cessaires au fonctionnement du site (authentification, prÃ©fÃ©rences)
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#3B3B3B] mb-2">Cookies analytiques</h3>
                <p className="text-[#3B3B3B]/70">
                  Nous aident ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  comprendre comment vous utilisez ECOLOJIA (anonymisÃ©s)
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#7DDE4A]" />
              Vos droits
            </h2>
            <p className="text-[#3B3B3B]/70 mb-4">ConformÃ©ment au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
              <li>Droit d'accÃ¨s ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  vos donnÃ©es personnelles</li>
              <li>Droit de rectification des donnÃ©es inexactes</li>
              <li>Droit ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  l'effacement (droit ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  l'oubli)</li>
              <li>Droit ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  la limitation du traitement</li>
              <li>Droit ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  la portabilitÃ© des donnÃ©es</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit de retirer votre consentement ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tout moment</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6 text-[#7DDE4A]" />
              Contact
            </h2>
            <div className="bg-[#7DDE4A]/5 p-6 rounded-xl border border-[#7DDE4A]/20">
              <p className="text-[#3B3B3B]/70 mb-4">
                Pour toute question concernant vos donnÃ©es personnelles ou pour exercer vos droits :
              </p>
              <div className="space-y-2 text-[#3B3B3B]/70">
                <p><strong>Email :</strong> privacy@ecolojia.app</p>
                <p><strong>DPO :</strong> dpo@ecolojia.app</p>
                <p><strong>DÃ©lai de rÃ©ponse :</strong> 30 jours maximum</p>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4">
              Modifications
            </h2>
            <p className="text-[#3B3B3B]/70">
              Nous pouvons mettre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour cette politique de confidentialitÃ©. 
              Les modifications importantes seront notifiÃ©es par email ou via l'application.
              Nous vous encourageons ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  consulter rÃ©guliÃ¨rement cette page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;

