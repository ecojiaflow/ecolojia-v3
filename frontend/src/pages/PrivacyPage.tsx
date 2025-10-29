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
            Politique de Confidentialite
          </h1>
          <p className="text-[#3B3B3B]/70 text-lg">
            Derniere mise Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 mt-4 text-[#7DDE4A] hover:text-[#3B3B3B] transition-colors text-sm"
          >
            aaaââ‚¬Å¡Ã‚Â¬'šÃ‚Â Æ’ââ‚¬Å¡'šÃ‚Â Retour Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  l'accueil
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
                  Chez ECOLOJIA, nous nous engageons Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  proteger votre vie privee et vos donnees personnelles. 
                  Cette politique explique comment nous collectons, utilisons et protegeons vos informations.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6 text-[#7DDE4A]" />
              Donnees collectees
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#3B3B3B]">Donnees collectees automatiquement</h3>
              <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
                <li>Adresse IP et informations de connexion</li>
                <li>Type d'appareil et systeme d'exploitation</li>
                <li>Pages visitees et duree de visite</li>
                <li>Historique de recherche de produits (anonymise)</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-[#3B3B3B] mt-6">Donnees fournies volontairement</h3>
              <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
                <li>Nom et adresse email lors de l'inscription</li>
                <li>Preferences alimentaires et restrictions</li>
                <li>Photos de produits scannes (supprimees apres analyse)</li>
                <li>Messages envoyes via le formulaire de contact</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-[#7DDE4A]" />
              Utilisation des donnees
            </h2>
            <p className="text-[#3B3B3B]/70 mb-4">Nous utilisons vos donnees uniquement pour :</p>
            <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
              <li>Fournir et ameliorer nos services d'analyse de produits</li>
              <li>Personnaliser votre experience utilisateur</li>
              <li>Vous envoyer des notifications pertinentes (avec votre consentement)</li>
              <li>Repondre Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  vos questions et demandes de support</li>
              <li>Ameliorer nos algorithmes d'analyse</li>
              <li>Respecter nos obligations legales</li>
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
                  Necessaires au fonctionnement du site (authentification, preferences)
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#3B3B3B] mb-2">Cookies analytiques</h3>
                <p className="text-[#3B3B3B]/70">
                  Nous aident Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  comprendre comment vous utilisez ECOLOJIA (anonymises)
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#7DDE4A]" />
              Vos droits
            </h2>
            <p className="text-[#3B3B3B]/70 mb-4">Conformement au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside space-y-2 text-[#3B3B3B]/70">
              <li>Droit d'acces Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  vos donnees personnelles</li>
              <li>Droit de rectification des donnees inexactes</li>
              <li>Droit Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  l'effacement (droit Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  l'oubli)</li>
              <li>Droit Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  la limitation du traitement</li>
              <li>Droit Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  la portabilite des donnees</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit de retirer votre consentement Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  tout moment</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6 text-[#7DDE4A]" />
              Contact
            </h2>
            <div className="bg-[#7DDE4A]/5 p-6 rounded-xl border border-[#7DDE4A]/20">
              <p className="text-[#3B3B3B]/70 mb-4">
                Pour toute question concernant vos donnees personnelles ou pour exercer vos droits :
              </p>
              <div className="space-y-2 text-[#3B3B3B]/70">
                <p><strong>Email :</strong> privacy@ecoloji?.app</p>
                <p><strong>DPO :</strong> dpo@ecoloji?.app</p>
                <p><strong>Delai de reponse :</strong> 30 jours maximum</p>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-[#3B3B3B] mb-4">
              Modifications
            </h2>
            <p className="text-[#3B3B3B]/70">
              Nous pouvons mettre Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  jour cette politique de confidentialite. 
              Les modifications importantes seront notifiees par email ou via l'application.
              Nous vous encourageons Æ’Ã†'' ââ‚¬â„¢Æ’ââ‚¬Å¡'šÃ‚Â  consulter regulierement cette page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;



