// src/pages/TestAffiliate.tsx
import React from 'react';
import AffiliateButton from '../components/AffiliateButton';

const TestAffiliate: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          ÃƒÂ°Ã…Â¸Ã‚Â§Ã‚Âª Test du Système d'Affiliation ECOLOJIA
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â« Produit Test : Nutella</h2>
          <p className="text-gray-600 mb-6">
            Cliquez sur le bouton ci-dessous pour tester l'affiliation avec Nutella
          </p>
          
          <AffiliateButton 
            productId="507f1f77bcf86cd799439011"
            productName="Nutella Pâte ÃƒÆ’Ã‚Â  tartiner"
            source="product_page"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">ÃƒÂ°Ã…Â¸Ã‚Â¥Ã‚Â¤ Produit Test : Coca-Cola</h2>
          <p className="text-gray-600 mb-6">
            Un autre test avec Coca-Cola
          </p>
          
          <AffiliateButton 
            productId="507f1f77bcf86cd799439012"
            productName="Coca-Cola Original"
            source="product_page"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">ÃƒÂ°Ã…Â¸Ã‚Â¥ââ‚¬Âº Produit Test : Yaourt Bio</h2>
          <p className="text-gray-600 mb-6">
            Test avec un produit sain
          </p>
          
          <AffiliateButton 
            productId="507f1f77bcf86cd799439013"
            productName="Yaourt Nature Bio"
            source="product_page"
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-blue-800 mb-4">ÃƒÂ°Ã…Â¸ââ‚¬Å“ââ‚¬Â¹ Instructions de test :</h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-2">
            <li>Cliquez sur "Acheter ce produit" ÃƒÂ°Ã…Â¸ââ‚¬Âºââ‚¬â„¢</li>
            <li>Un menu déroulant apparaît avec 3 partenaires</li>
            <li>Sélectionnez un partenaire (La Fourche, Kazidomi, ou Greenweez)</li>
            <li>Vous serez redirigé vers le site partenaire</li>
            <li>Vérifiez l'URL : elle contient les paramètres de tracking</li>
          </ol>
        </div>

        <div className="mt-6 bg-green-50 rounded-lg p-6">
          <h3 className="font-bold text-green-800 mb-2">âÃ…â€œââ‚¬Â¦ Statut du système :</h3>
          <ul className="text-green-700 space-y-1">
            <li>ââ‚¬Ã‚Â¢ Frontend : Connecté âÃ…â€œââ‚¬Å“</li>
            <li>ââ‚¬Ã‚Â¢ Backend : Port 5001 âÃ…â€œââ‚¬Å“</li>
            <li>ââ‚¬Ã‚Â¢ MongoDB : Connecté âÃ…â€œââ‚¬Å“</li>
            <li>ââ‚¬Ã‚Â¢ Routes affiliées : Actives âÃ…â€œââ‚¬Å“</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestAffiliate;

