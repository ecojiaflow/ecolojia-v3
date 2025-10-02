// PATH: frontend/src/pages/OnboardingPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, Leaf, Shield, Check } from 'lucide-react';
import { useAuthContext } from '../Contexts/AuthContext';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [  // Correction: utiliser des crochets [] au lieu de {}
  {
    id: 1,
    title: 'Vos objectifs santé',
    subtitle: 'Personnalisez votre expérience',
    icon: <Heart className="w-8 h-8" />
  },
  {
    id: 2,
    title: 'Allergies & régimes',
    subtitle: 'Pour des recommandations adaptées',
    icon: <Shield className="w-8 h-8" />
  },
  {
    id: 3,
    title: 'Préférences',
    subtitle: 'Finalisez votre profil',
    icon: <Leaf className="w-8 h-8" />
  }
];

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // État pour les données du formulaire
  const [formData, setFormData] = useState({
    healthGoals: [] as string[],
    allergies: [] as string[],
    diets: [] as string[],
    notificationPreferences: {
      email: true,
      push: false,
      marketing: false
    }
  });

  const healthGoalOptions = [
    { value: 'weight-loss', label: 'Perdre du poids', icon: '⚖️' },
    { value: 'muscle-gain', label: 'Prendre du muscle', icon: '💪' },
    { value: 'health', label: 'Améliorer ma santé', icon: '❤️' },
    { value: 'energy', label: 'Plus d\'énergie', icon: '⚡' },
    { value: 'sleep', label: 'Mieux dormir', icon: '😴' },
    { value: 'digestion', label: 'Meilleure digestion', icon: '🌿' }
  ];

  const allergyOptions = [
    { value: 'gluten', label: 'Gluten', icon: '🌾' },
    { value: 'lactose', label: 'Lactose', icon: '🥛' },
    { value: 'nuts', label: 'Fruits à coque', icon: '🥜' },
    { value: 'eggs', label: 'Œufs', icon: '🥚' },
    { value: 'soy', label: 'Soja', icon: '🌱' },
    { value: 'shellfish', label: 'Crustacés', icon: '🦐' }
  ];

  const dietOptions = [
    { value: 'vegetarian', label: 'Végétarien', icon: '🥗' },
    { value: 'vegan', label: 'Végétalien', icon: '🌱' },
    { value: 'halal', label: 'Halal', icon: '☪️' },
    { value: 'kosher', label: 'Casher', icon: '✡️' },
    { value: 'gluten-free', label: 'Sans gluten', icon: '🚫' },
    { value: 'keto', label: 'Cétogène', icon: '🥑' }
  ];

  const toggleSelection = (field: 'healthGoals' | 'allergies' | 'diets', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await authService.updateProfile({
        healthGoals: formData.healthGoals,
        allergies: formData.allergies,
        diets: formData.diets,
        notifications: formData.notificationPreferences
      });

      await updateProfile({
        ...user,
        preferences: {
          ...user?.preferences,
          ...formData
        }
      });

      toast.success('Profil configuré avec succès !');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erreur lors de la configuration du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Quels sont vos objectifs santé ?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {healthGoalOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => toggleSelection('healthGoals', option.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.healthGoals.includes(option.value)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium text-gray-800">{option.label}</span>
                    {formData.healthGoals.includes(option.value) && (
                      <Check className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Avez-vous des allergies ?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {allergyOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleSelection('allergies', option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.allergies.includes(option.value)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{option.icon}</span>
                      <span className="font-medium text-gray-800 text-sm">{option.label}</span>
                      {formData.allergies.includes(option.value) && (
                        <Check className="w-4 h-4 text-red-500 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Suivez-vous un régime particulier ?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {dietOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleSelection('diets', option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.diets.includes(option.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{option.icon}</span>
                      <span className="font-medium text-gray-800 text-sm">{option.label}</span>
                      {formData.diets.includes(option.value) && (
                        <Check className="w-4 h-4 text-blue-500 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Préférences de notifications
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📧</span>
                  <div>
                    <div className="font-medium text-gray-800">Email</div>
                    <div className="text-sm text-gray-500">Recevez vos analyses par email</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notificationPreferences.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notificationPreferences: {
                      ...prev.notificationPreferences,
                      email: e.target.checked
                    }
                  }))}
                  className="w-5 h-5 text-green-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📱</span>
                  <div>
                    <div className="font-medium text-gray-800">Notifications push</div>
                    <div className="text-sm text-gray-500">Alertes sur nouveaux produits</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notificationPreferences.push}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notificationPreferences: {
                      ...prev.notificationPreferences,
                      push: e.target.checked
                    }
                  }))}
                  className="w-5 h-5 text-green-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🎯</span>
                  <div>
                    <div className="font-medium text-gray-800">Offres partenaires</div>
                    <div className="text-sm text-gray-500">Bons plans produits sains</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notificationPreferences.marketing}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notificationPreferences: {
                      ...prev.notificationPreferences,
                      marketing: e.target.checked
                    }
                  }))}
                  className="w-5 h-5 text-green-500"
                />
              </label>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                🔒 Vos données sont sécurisées et ne seront jamais partagées sans votre consentement.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Personnalisez votre expérience
          </h1>
          <p className="text-gray-600">
            Quelques questions pour mieux vous accompagner
          </p>
        </div>

        {/* Indicateur de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep >= step.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            {steps.map(step => (
              <div
                key={step.id}
                className={`text-center ${
                  currentStep >= step.id ? 'text-gray-800' : 'text-gray-400'
                }`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Contenu de l'étape */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          {renderStep()}
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Passer
          </button>
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center disabled:opacity-50"
          >
            {currentStep === 3 ? 'Terminer' : 'Suivant'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export { OnboardingPage };

