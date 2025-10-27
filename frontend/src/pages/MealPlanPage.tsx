import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Download, ArrowLeft } from 'lucide-react';
import { MealPlanWizard } from '../components/mealplan/MealPlanWizard';
import { Step1BudgetPersonnes } from '../components/mealplan/Step1BudgetPersonnes';
import { Step2RegimeCuisine } from '../components/mealplan/Step2RegimeCuisine';
import { Step3Allergenes } from '../components/mealplan/Step3Allergenes';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

interface MealPlanResult {
  meals: any[];
  nutrition: any;
  estimatedBudget: number;
  shoppingList: any[];
}

export const MealPlanPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<MealPlanResult | null>(null);
  const [disclaimers, setDisclaimers] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [budget, setBudget] = useState(80);
  const [people, setPeople] = useState(1);
  const [dietType, setDietType] = useState('balanced');
  const [cookingTime, setCookingTime] = useState('medium');
  const [allergens, setAllergens] = useState<string[]>([]);

  // Verification Premium
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isCheckingPremium, setIsCheckingPremium] = useState(true);

    React.useEffect(() => {
    const checkPremiumStatus = async () => {
      console.log('[MealPlan] Debut verification Premium...');
      
      try {
        const token = localStorage.getItem('token');
        console.log('[MealPlan] Token:', token ? 'Present' : 'Absent');
        
        if (!token) {
          console.log('[MealPlan] Pas de token - isPremium = false');
          setIsPremium(false);
          setIsCheckingPremium(false);
          return;
        }

        console.log('[MealPlan] Appel API:', `${API_URL}/api/auth/profile`);
        
        const response = await axios.get(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // Timeout 5 secondes
        });

        console.log('[MealPlan] Reponse API:', response.data);
        const premium = response.data.user?.plan === 'premium';
        console.log('[MealPlan] isPremium =', premium);
        setIsPremium(premium);
        
      } catch (error: any) {
        console.error('[MealPlan] Erreur verification Premium:', error.message);
        
        // En cas d'erreur réseau, on permet quand même l'accès (mode graceful)
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          console.warn('[MealPlan] Erreur reseau - Mode graceful: isPremium = true');
          setIsPremium(true); // Mode graceful pour démo
        } else {
          setIsPremium(false);
        }
      } finally {
        console.log('[MealPlan] Fin verification - isCheckingPremium = false');
        setIsCheckingPremium(false);
      }
    };

    // Timeout de sécurité : après 8 secondes, on force isPremium = true
    const safetyTimeout = setTimeout(() => {
      console.warn('[MealPlan] TIMEOUT 8s - Force isPremium = true (mode graceful)');
      setIsPremium(true);
      setIsCheckingPremium(false);
    }, 8000);

    checkPremiumStatus().then(() => {
      clearTimeout(safetyTimeout);
    });

    return () => clearTimeout(safetyTimeout);
  }, []);


  const totalSteps = 3;

  // Validation par step
  const canProceed = () => {
    if (currentStep === 1) return budget >= 20 && budget <= 500 && people >= 1;
    if (currentStep === 2) return dietType && cookingTime;
    if (currentStep === 3) return true; // Allergènes optionnels
    return false;
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Génération du plan
      await generatePlan();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/meal-plan/generate`,
        {
          budget,
          calories: 2000, // Valeur par défaut
          allergens,
          dietType,
          cookingTime,
          people
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setGeneratedPlan(response.data.data);
      setDisclaimers(response.data.disclaimers);
      
    } catch (err: any) {
      console.error('Erreur generation plan:', err);
      
      if (err.response?.status === 401) {
        setError('Session expiree. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(err.response?.data?.error || 'Erreur lors de la generation du plan');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadShoppingList = () => {
    if (!generatedPlan?.shoppingList) return;

    const text = generatedPlan.shoppingList
      .map(item => `- ${item.name}: ${item.quantity} ${item.unit}`)
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'liste-courses.txt';
    a.click();
  };

  // Vue verification Premium
  if (isCheckingPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verification de votre abonnement...</p>
        </div>
      </div>
    );
  }

  // Vue Non Premium
  if (isPremium === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-purple-100">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="text-purple-600" size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Fonctionnalite Premium
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            La generation de plans repas personnalises est reservee aux membres Premium. 
            Passez Premium pour profiter de cette fonctionnalite et bien plus encore.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/premium')}
              className="w-full h-12 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Decouvrir Premium
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full h-12 px-6 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Retour a l'accueil
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Essai gratuit de 7 jours disponible
          </p>
        </div>
      </div>
    );
  }

  // Vue chargement
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-600" size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Creation de votre plan repas...
            </h3>
            <p className="text-gray-600">
              Notre IA nutritionniste prepare un plan personnalise
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Vue résultats
  if (generatedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setGeneratedPlan(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft size={20} />
              <span>Generer un nouveau plan</span>
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Votre plan repas hebdomadaire
            </h1>
            <p className="text-gray-600">
              Budget: {generatedPlan.estimatedBudget} EUR • {people} personne(s)
            </p>
          </div>

          {/* Disclaimers */}
          {disclaimers && (
            <div className="space-y-3 mb-8">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                {disclaimers.health}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                {disclaimers.ai}
              </div>
              {allergens.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-900">
                  {disclaimers.allergens}
                </div>
              )}
            </div>
          )}

          {/* Repas */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Vos 7 repas</h2>
            {generatedPlan.meals.map((meal, index) => (
              <div key={index} className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Jour {meal.day}</div>
                    <h3 className="text-xl font-bold text-gray-800">{meal.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Cout</div>
                    <div className="text-lg font-bold text-green-600">{meal.cost} EUR</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Calories</div>
                    <div className="font-semibold">{meal.nutrition.calories} kcal</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Proteines</div>
                    <div className="font-semibold">{meal.nutrition.protein}g</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Glucides</div>
                    <div className="font-semibold">{meal.nutrition.carbs}g</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Temps</div>
                    <div className="font-semibold">{meal.cookingTime} min</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Liste de courses */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Liste de courses</h2>
              <button
                onClick={downloadShoppingList}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download size={18} />
                <span>Telecharger</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {generatedPlan.shoppingList.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-800">{item.name}</span>
                  <span className="font-medium text-gray-600">{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Erreur</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  // Vue wizard
  return (
    <MealPlanWizard
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onPrev={handlePrev}
      canProceed={canProceed()}
    >
      {currentStep === 1 && (
        <Step1BudgetPersonnes
          budget={budget}
          people={people}
          onBudgetChange={setBudget}
          onPeopleChange={setPeople}
        />
      )}
      
      {currentStep === 2 && (
        <Step2RegimeCuisine
          dietType={dietType}
          cookingTime={cookingTime}
          onDietChange={setDietType}
          onCookingTimeChange={setCookingTime}
        />
      )}
      
      {currentStep === 3 && (
        <Step3Allergenes
          allergens={allergens}
          onAllergensChange={setAllergens}
        />
      )}
    </MealPlanWizard>
  );
};
