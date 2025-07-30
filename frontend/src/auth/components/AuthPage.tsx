// frontend/src/auth/components/AuthPage.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'register' | 'success';

interface AuthPageProps {
  defaultMode?: AuthMode;
  redirectTo?: string;
  className?: string;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  defaultMode = 'login',
  redirectTo = '/dashboard',
  className = ''
}) => {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  
  const { isAuthenticated, startDemoSession } = useAuth();
  const navigate = useNavigate();

  // Si déjà connecté, rediriger
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

  // Handlers pour forms
  const handleLoginSuccess = useCallback(() => {
    navigate(redirectTo);
  }, [navigate, redirectTo]);

  const handleRegisterSuccess = useCallback(() => {
    setMode('success');
  }, []);

  const handleSwitchToRegister = useCallback(() => {
    setMode('register');
  }, []);

  const handleSwitchToLogin = useCallback(() => {
    setMode('login');
  }, []);

  // ✅ NOUVELLE FONCTION MODE DÉMO CORRIGÉE
  const handleDemoMode = useCallback(async (tier: 'free' | 'premium' = 'premium') => {
    if (!startDemoSession) {
      console.error('❌ startDemoSession non disponible');
      alert('Service mode démo temporairement indisponible');
      return;
    }

    try {
      setIsDemoLoading(true);
      console.log(`🎭 Activation mode démo ${tier} demandée`);
      
      // Utiliser le service intégré dans AuthContext
      await startDemoSession(tier);
      
      console.log('✅ Mode démo activé via AuthContext');
      
      // Petite pause pour UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirection automatique via useEffect au changement de isAuthenticated
      
    } catch (error) {
      console.error('❌ Erreur activation mode démo:', error);
      alert('Erreur lors de l\'activation du mode démo. Veuillez réessayer.');
    } finally {
      setIsDemoLoading(false);
    }
  }, [startDemoSession]);

  // ✅ FONCTIONS POUR LES DEUX TIERS
  const handleFreeDemoMode = useCallback(() => handleDemoMode('free'), [handleDemoMode]);
  const handlePremiumDemoMode = useCallback(() => handleDemoMode('premium'), [handleDemoMode]);

  if (mode === 'success') {
    return (
      <div className={`auth-success ${className}`}>
        <SuccessMessage 
          email={registrationEmail}
          onBackToLogin={() => setMode('login')}
        />
      </div>
    );
  }

  return (
    <div className={`auth-page min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ECOLOJIA
          </h1>
          <p className="text-lg text-gray-600">
            Votre assistant IA pour une consommation éclairée
          </p>
        </div>

        {/* ✅ SECTION MODE DÉMO AMÉLIORÉE */}
        <div className="flex justify-center mb-8">
          <div className="max-w-4xl w-full">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              🎭 Tester ECOLOJIA en Mode Démo
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mode Démo FREE */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3">🆓</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Démo Gratuite
                </h3>
                <p className="text-blue-100 text-sm mb-4">
                  Découvrez les fonctionnalités de base
                </p>
                
                <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-4 text-left">
                  <div className="text-xs text-blue-100 space-y-1">
                    <div className="flex items-center">
                      <span className="text-blue-200 mr-2">✓</span>
                      <span>25 analyses/mois</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-blue-200 mr-2">✓</span>
                      <span>IA scientifique complète</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-blue-200 mr-2">✓</span>
                      <span>Dashboard basique</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-red-300 mr-2">✗</span>
                      <span>Chat IA premium</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleFreeDemoMode}
                  disabled={isDemoLoading}
                  className="w-full py-3 px-6 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDemoLoading ? '⏳ Chargement...' : '🎯 Essayer Version Gratuite'}
                </button>
              </div>

              {/* Mode Démo PREMIUM */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-6 text-center relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                    ⭐ RECOMMANDÉ
                  </span>
                </div>
                
                <div className="text-4xl mb-3 mt-2">🚀</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Démo Premium
                </h3>
                <p className="text-purple-100 text-sm mb-4">
                  Explorez toutes les fonctionnalités avancées
                </p>
                
                <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-4 text-left">
                  <div className="text-xs text-purple-100 space-y-1">
                    <div className="flex items-center">
                      <span className="text-purple-200 mr-2">✓</span>
                      <span>Analyses illimitées</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-200 mr-2">✓</span>
                      <span>Chat IA DeepSeek personnalisé</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-200 mr-2">✓</span>
                      <span>Dashboard analytics complet</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-200 mr-2">✓</span>
                      <span>Export données + API</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handlePremiumDemoMode}
                  disabled={isDemoLoading}
                  className="w-full py-3 px-6 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDemoLoading ? '⏳ Chargement...' : '🎯 Essayer Version Premium'}
                </button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm text-center flex items-center justify-center">
                <span className="text-blue-500 mr-2">💡</span>
                <span>
                  <strong>Mode Démo :</strong> Données factices stockées localement • Aucune inscription requise • Exploration complète de l'interface
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="flex items-center justify-center mb-8">
          <div className="border-t border-gray-300 flex-1 max-w-xs"></div>
          <div className="px-4 text-gray-500 text-sm">ou créer un compte réel</div>
          <div className="border-t border-gray-300 flex-1 max-w-xs"></div>
        </div>

        {/* Auth Forms */}
        <div className="flex justify-center">
          <div className="max-w-md w-full">
            {mode === 'login' ? (
              <LoginForm
                onSuccess={handleLoginSuccess}
                onSwitchToRegister={handleSwitchToRegister}
              />
            ) : (
              <RegisterForm
                onSuccess={handleRegisterSuccess}
                onSwitchToLogin={handleSwitchToLogin}
              />
            )}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Pourquoi choisir ECOLOJIA ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🔬</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                IA Scientifique Propriétaire
              </h3>
              <p className="text-gray-600">
                Analyses basées sur INSERM, ANSES et EFSA. 
                Classification NOVA, détection ultra-transformation pour tous produits.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Chat IA Expert Premium
              </h3>
              <p className="text-gray-600">
                Questions illimitées à notre nutritionniste IA DeepSeek. 
                Conseils personnalisés et alternatives sur mesure.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Multi-Catégories Unique
              </h3>
              <p className="text-gray-600">
                Alimentaire, cosmétiques, détergents dans une seule app. 
                Seule plateforme européenne complète.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Final */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              🌱 Prêt à commencer votre parcours santé consciente ?
            </h3>
            <p className="text-green-100 mb-6">
              Rejoignez des milliers d'utilisateurs qui ont déjà amélioré leur consommation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handlePremiumDemoMode}
                disabled={isDemoLoading}
                className="px-8 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
              >
                {isDemoLoading ? '⏳ Chargement...' : '🎯 Essayer Premium Démo'}
              </button>
              <button
                onClick={() => setMode('register')}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg border-2 border-green-600 hover:bg-green-700 hover:border-green-700 transition-all duration-200"
              >
                📝 Créer un Compte Gratuit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success Message Component
interface SuccessMessageProps {
  email: string;
  onBackToLogin: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ email, onBackToLogin }) => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="text-6xl mb-6">🎉</div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Compte créé avec succès !
      </h2>
      
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800">
          <strong>📧 Vérifiez votre email</strong>
        </p>
        <p className="text-green-700 text-sm mt-2">
          Nous avons envoyé un lien de vérification à <strong>{email}</strong>
        </p>
      </div>
      
      <div className="space-y-4 text-sm text-gray-600">
        <p>
          <strong>Étapes suivantes :</strong>
        </p>
        <div className="text-left space-y-2">
          <div className="flex items-start">
            <span className="text-blue-500 mr-2">1.</span>
            <span>Ouvrez votre boîte email</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-500 mr-2">2.</span>
            <span>Cliquez sur le lien de vérification</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-500 mr-2">3.</span>
            <span>Connectez-vous et commencez à scanner !</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <button
          onClick={onBackToLogin}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
        >
          🚀 Aller à la connexion
        </button>
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>💡 Conseil :</strong> Vérifiez aussi vos spams si vous ne voyez pas l'email
        </p>
      </div>
    </div>
  </div>
);