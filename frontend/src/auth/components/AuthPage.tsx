// PATH: frontend/src/auth/components/AuthPage.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Leaf, Heart, Shield } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  defaultMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [demoError, setDemoError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { startDemoMode } = useAuth();

  const handleStartDemo = async () => {
    try {
      setDemoError(null);
      
      // Vérifier si startDemoMode existe
      if (typeof startDemoMode !== 'function') {
        console.error('❌ startDemoMode non disponible');
        // Fallback: activer le mode démo manuellement
        localStorage.setItem('ecolojia_demo_mode', 'true');
        // Créer un utilisateur démo
        const demoUser = {
          _id: 'demo-user-' + Date.now(),
          email: 'demo@ecolojia.app',
          name: 'Utilisateur Démo',
          profile: {
            firstName: 'Utilisateur',
            lastName: 'Démo',
            avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=7DDE4A&color=fff'
          },
          tier: 'premium' as const,
          emailVerified: true,
          quotas: {
            scansUsed: 15,
            scansLimit: -1,
            aiChatsUsed: 10,
            aiChatsLimit: -1,
            lastReset: new Date().toISOString()
          }
        };
        
        localStorage.setItem('ecolojia_token', 'demo-token-' + Date.now());
        localStorage.setItem('ecolojia_user', JSON.stringify(demoUser));
        
        // Recharger la page pour appliquer les changements
        window.location.href = '/dashboard';
        return;
      }
      
      await startDemoMode();
    } catch (error) {
      console.error('❌ Erreur activation mode démo:', error);
      setDemoError('Impossible d\'activer le mode démo. Veuillez réessayer.');
    }
  };

  const features = [
    {
      icon: Heart,
      title: 'Santé',
      description: 'Analysez l\'impact des produits sur votre santé'
    },
    {
      icon: Leaf,
      title: 'Environnement',
      description: 'Découvrez l\'empreinte écologique de vos achats'
    },
    {
      icon: Shield,
      title: 'Transparence',
      description: 'Accédez à des informations vérifiées et sourcées'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F9F4] to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">
          {/* Left side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-[#3B3B3B] mb-4">
                ECOLOJIA
              </h1>
              <p className="text-xl text-gray-600">
                Votre guide pour une consommation éclairée et responsable
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 * (index + 1) }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-[#7DDE4A]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-[#7DDE4A]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#3B3B3B] mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="p-6 bg-[#7DDE4A]/5 rounded-xl border border-[#7DDE4A]/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-[#7DDE4A]" />
                <h4 className="font-semibold text-[#3B3B3B]">
                  Essayez le mode démo
                </h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Découvrez toutes les fonctionnalités d'ECOLOJIA sans créer de compte
              </p>
              <button
                onClick={handleStartDemo}
                className="w-full px-4 py-2 bg-[#7DDE4A] text-white rounded-lg font-medium hover:bg-[#6BC93B] transition-colors"
              >
                Démarrer la démo
              </button>
              {demoError && (
                <p className="text-red-600 text-sm mt-2">{demoError}</p>
              )}
            </motion.div>
          </motion.div>

          {/* Right side - Auth forms */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              {/* Logo mobile */}
              <div className="lg:hidden mb-6 text-center">
                <h1 className="text-3xl font-bold text-[#3B3B3B]">ECOLOJIA</h1>
              </div>

              {/* Tabs */}
              <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    mode === 'login'
                      ? 'bg-white text-[#3B3B3B] shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Connexion
                </button>
                <button
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    mode === 'register'
                      ? 'bg-white text-[#3B3B3B] shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Inscription
                </button>
              </div>

              {/* Forms */}
              <AnimatePresence mode="wait">
                {mode === 'login' ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <LoginForm />
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RegisterForm />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Demo button mobile */}
              <div className="lg:hidden mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleStartDemo}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Essayer le mode démo
                </button>
                {demoError && (
                  <p className="text-red-600 text-sm mt-2 text-center">{demoError}</p>
                )}
              </div>
            </div>

            {/* Legal */}
            <p className="text-center text-xs text-gray-500 mt-6">
              En continuant, vous acceptez nos{' '}
              <a href="/terms" className="text-[#7DDE4A] hover:underline">
                Conditions d'utilisation
              </a>{' '}
              et notre{' '}
              <a href="/privacy" className="text-[#7DDE4A] hover:underline">
                Politique de confidentialité
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;