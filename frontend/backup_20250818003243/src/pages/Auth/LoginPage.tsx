import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, LogIn, ArrowRight } from 'lucide-react';
import authService from '@/services/authService';
import configService from '@/services/configService';
import { useToast } from '@/hooks/use-toast';

interface LocationState {
  froma: string;
  messagea: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const state = location.state as LocationState;

  // aatat du formulaire
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDemoMode, setShowDemoMode] = useState(true);

  // Afficher un message si redirige
  useEffect(() => {
    if (state?.message) {
      toast({
        title: "Information",
        description: state.message,
        variant: "default"
      });
    }
  }, [state, toast]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formDat?.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formDat?.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formDat?.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formDat?.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de la soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await authService.login({
        email: formDat?.email,
        password: formDat?.password,
        rememberMe: formDat?.rememberMe
      });

      toast({
        title: "Connexion reussie",
        description: `Bienvenue ${response.user.username} !`,
        variant: "default"
      });

      // Rediriger vers la page demandee ou le dashboard
      const redirectTo = state?.from || '/dashboard';
      navigate(redirectTo);

    } catch (error: any) {
      console.error('Login error:', error);
      
      // Gestion des erreurs specifiques
      if (error.message.includes('Invalid credentials')) {
        setErrors({ general: 'Email ou mot de passe incorrect' });
      } else if (error.message.includes('Account not verified')) {
        setErrors({ general: 'Veuillez verifier votre email avant de vous connecter' });
      } else if (error.message.includes('Account suspended')) {
        setErrors({ general: 'Votre compte ? ete suspendu. Contactez le support.' });
      } else {
        setErrors({ general: error.message || 'Erreur de connexion' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Continuer en mode demo
  const handleDemoMode = () => {
    configService.setMode('demo');
    toast({
      title: "Mode demo active",
      description: "Explorez l'application avec des donnees de demonstration",
      variant: "default"
    });
    navigate('/');
  };

  // Remplir avec des donnees de test
  const fillDemoCredentials = () => {
    setFormData({
      email: 'demo@ecoloji?.app',
      password: 'demo123',
      rememberMe: true
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link to="/">
            <motion.h1 
              className="text-4xl font-bold text-primary-600 mb-2"
              whileHover={{ scale: 1.05 }}
            >
              ECOLOJIA
            </motion.h1>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Connexion
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              creer un compte gratuit
            </Link>
          </p>
        </div>

        {/* Formulaire */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Erreur generale */}
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-sm">{errors.general}</span>
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formDat?.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`appearance-none block w-full px-3 py-2 pl-10 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  placeholder="vous@exemple.com"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formDat?.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`appearance-none block w-full px-3 py-2 pl-10 pr-10 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  placeholder="aaaaaaaaaaaaaaaa"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={formDat?.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Se souvenir de moi
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Mot de passe oublie a
              </Link>
            </div>
          </div>

          {/* Bouton de connexion */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Se connecter
                </>
              )}
            </button>
          </div>

          {/* Separateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Ou</span>
            </div>
          </div>

          {/* Mode demo */}
          {showDemoMode && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleDemoMode}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                Continuer en mode demo
              </button>
              
              {/* Lien pour remplir les identifiants de demo */}
              {import.met?.env.DEV && (
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="w-full text-xs text-gray-500 hover:text-gray-700"
                >
                  Remplir avec les identifiants de test
                </button>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            En vous connectant, vous acceptez nos{' '}
            <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
              conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
              politique de confidentialite
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}


