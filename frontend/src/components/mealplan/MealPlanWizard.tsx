import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  canProceed: boolean;
  children: React.ReactNode;
}

export const MealPlanWizard: React.FC<WizardProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  canProceed,
  children
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 pb-20 md:pb-8">
      {/* Container adaptatif */}
      <div className="w-full max-w-2xl mx-auto px-4 py-6 md:py-12">
        
        {/* Progress bar - Full width mobile */}
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm md:text-base font-medium text-gray-700">
              Etape {currentStep} sur {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content card - Glassmorphism */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-xl border border-white/50 p-5 md:p-8">
          {children}
        </div>

        {/* Navigation - Sticky bottom mobile, inline desktop */}
        <div className="fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto bg-white md:bg-transparent border-t md:border-0 border-gray-200 p-4 md:p-0 md:mt-6 flex justify-between items-center gap-3">
          
          {/* Bouton Retour */}
          <button
            onClick={onPrev}
            disabled={currentStep === 1}
            className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-2 text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100 min-w-[44px] min-h-[44px]"
          >
            <ChevronLeft size={20} />
            <span className="hidden md:inline">Retour</span>
          </button>

          {/* Bouton Suivant - CTA principal */}
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 md:px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg md:rounded-xl font-medium hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] transform active:scale-95"
          >
            <span className="text-base md:text-sm">
              {currentStep === totalSteps ? 'Generer mon plan' : 'Suivant'}
            </span>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Spacer pour navigation sticky mobile */}
        <div className="h-20 md:hidden" />
      </div>
    </div>
  );
};