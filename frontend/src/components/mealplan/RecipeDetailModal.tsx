import React, { useState } from 'react';
import { X, ChefHat, Clock, Users, TrendingUp, MessageCircle, Check, Sparkles } from 'lucide-react';
import axios from 'axios';

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: {
    name: string;
    ingredients: string[];
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
    cookingTime: number;
    day: number;
  };
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ isOpen, onClose, meal }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAIMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [aiInput, setAIInput] = useState('');
  const [aiLoading, setAILoading] = useState(false);

  const recipeSteps = [
    `Préparer et laver tous les ingrédients : ${meal.ingredients.join(', ')}`,
    'Préchauffer le four à 180°C (ou préparer la poêle/casserole)',
    'Découper les ingrédients selon les besoins de la recette',
    'Commencer la cuisson en suivant les temps recommandés',
    'Assaisonner et finaliser la préparation',
    'Dresser l\'assiette et déguster !'
  ];

  const toggleStepComplete = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const sendAIMessage = async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput;
    setAIInput('');
    setAIMessages([...aiMessages, { role: 'user', content: userMessage }]);
    setAILoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: userMessage,
        context: {
          type: 'recipe_assistance',
          meal: meal.name,
          ingredients: meal.ingredients,
          currentStep: recipeSteps[currentStep]
        }
      });

      setAIMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response 
      }]);
    } catch (error) {
      console.error('Erreur IA:', error);
      setAIMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Désolé, je ne peux pas répondre pour le moment. Réessayez !' 
      }]);
    } finally {
      setAILoading(false);
    }
  };

  if (!isOpen) return null;

  const progress = (completedSteps.size / recipeSteps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <ChefHat className="w-8 h-8" />
            <h2 className="text-2xl font-bold">{meal.name}</h2>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{meal.cookingTime} min</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>{meal.nutrition.calories} kcal</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>1 personne</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Progression</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-primary-600">📋</span>
              Ingrédients
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {meal.ingredients.map((ingredient, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  <span>{ingredient}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-primary-600">👨‍🍳</span>
              Étapes de préparation
            </h3>
            <div className="space-y-3">
              {recipeSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    completedSteps.has(idx)
                      ? 'bg-green-50 border-green-200'
                      : currentStep === idx
                      ? 'bg-primary-50 border-primary-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setCurrentStep(idx);
                    toggleStepComplete(idx);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      completedSteps.has(idx)
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-700 border-2 border-gray-300'
                    }`}>
                      {completedSteps.has(idx) ? <Check className="w-5 h-5" /> : idx + 1}
                    </div>
                    <p className={`flex-1 text-sm ${
                      completedSteps.has(idx) ? 'text-gray-600 line-through' : 'text-gray-800'
                    }`}>
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {!showAIChat ? (
            <button
              onClick={() => setShowAIChat(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="w-5 h-5" />
              <span>Besoin d'aide ? Demandez à l'IA</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-600" />
                  Assistant cuisine IA
                </span>
                <button
                  onClick={() => setShowAIChat(false)}
                  className="text-xs text-neutral-700 hover:text-gray-700"
                >
                  Fermer
                </button>
              </div>

              <div className="max-h-32 overflow-y-auto space-y-2 text-sm">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary-100 text-primary-900 ml-8'
                        : 'bg-gray-100 text-gray-900 mr-8'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {aiLoading && (
                  <div className="text-center text-neutral-700 text-xs">
                    L'IA réfléchit...
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAIInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                  placeholder="Ex: Comment savoir si le poulet est cuit ?"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={aiLoading}
                />
                <button
                  onClick={sendAIMessage}
                  disabled={aiLoading || !aiInput.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Envoyer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};