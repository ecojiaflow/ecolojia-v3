import React from 'react';
import { Leaf } from 'lucide-react';

/**
 * SignatureFooter.tsx - Element de marque Ecolojia
 * Phrase signature affichee sur chaque fiche produit et page Learn
 */

const SignatureFooter: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-emerald-800 font-medium text-sm leading-relaxed">
            L ensemble du repas compte plus qu un aliment isole.
          </p>
          <p className="text-emerald-800 font-medium text-sm leading-relaxed">
            L ensemble de la semaine compte plus qu un repas isole.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignatureFooter;
