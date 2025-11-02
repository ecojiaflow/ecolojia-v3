import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, ArrowLeft } from 'lucide-react';

export const MealPlanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const productId = location.state?.productId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3FBF5] to-white pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header succès */}
        <div className="bg-white rounded-[24px] shadow-lg p-8 mb-6 text-center border-2 border-[#7DDE4A]">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#F3FBF5] rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[#1B9E4B]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#0E1A0D] mb-3">
            Plan repas créé avec succès ! 🎉
          </h1>
          <p className="text-lg text-[#4A5568] mb-6">
            Votre plan repas de la semaine est prêt.
          </p>
          
          {/* Infos debug */}
          <div className="bg-[#FFF8E6] border border-[#FFE8A8] rounded-[16px] p-4 mb-6">
            <p className="text-sm text-[#6B4D00] mb-2">
              <strong>Plan ID :</strong> {id}
            </p>
            {productId && (
              <p className="text-sm text-[#6B4D00]">
                <strong>Produit à ajouter :</strong> {productId}
              </p>
            )}
          </div>

          {/* Message temporaire */}
          <div className="bg-[#E6F4FF] border border-[#91D5FF] rounded-[16px] p-6 mb-6">
            <Calendar className="w-12 h-12 text-[#1890FF] mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-[#0E1A0D] mb-2">
              Calendrier de repas en développement
            </h2>
            <p className="text-[#4A5568]">
              Le calendrier interactif pour planifier vos repas arrivera dans la prochaine version.
              Pour l'instant, votre plan hebdomadaire a été créé avec succès !
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2E7DD7] hover:bg-[#1D4ED8] text-white rounded-[16px] font-semibold transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour au produit
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#7DDE4A] hover:bg-[#5FC72F] text-[#0E1A0D] rounded-[16px] font-semibold transition-all"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>

        {/* Prochaines étapes */}
        <div className="bg-white rounded-[24px] shadow-lg p-6">
          <h3 className="text-xl font-semibold text-[#0E1A0D] mb-4">
            📋 Prochainement disponible
          </h3>
          <ul className="space-y-3 text-[#4A5568]">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#7DDE4A] flex-shrink-0 mt-0.5" />
              <span>Calendrier interactif pour visualiser vos repas de la semaine</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#7DDE4A] flex-shrink-0 mt-0.5" />
              <span>Ajout de produits par catégorie (petit-déjeuner, déjeuner, dîner, snack)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#7DDE4A] flex-shrink-0 mt-0.5" />
              <span>Score nutritionnel moyen de votre semaine</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#7DDE4A] flex-shrink-0 mt-0.5" />
              <span>Export PDF de votre plan repas</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};