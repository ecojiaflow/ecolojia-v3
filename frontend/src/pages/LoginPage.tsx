// ========================================
// FICHIER 3: src/pages/LoginPage.tsx (avec redirection corrigée)
// ========================================
// PATH: frontend/src/pages/LoginPage.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Leaf, ArrowRight } from 'lucide-react';
import { useAuthContext } from '../Contexts/AuthContext';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirection si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Connexion réussie !');
      
      // La redirection se fera automatiquement via useEffect
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      toast.error(error?.message || 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  // Connexion rapide pour démo
  const handleDemoLogin = async () => {
    setFormData({
      email: 'demo@ecolojia.app',
      password: 'demo123'
    });
    
    setIsLoading(true);
    try {
      await login('demo@ecolojia.app', 'demo123');
      toast.success('Connexion démo réussie !');
      
      // La redirection se fera automatiquement via useEffect
    } catch (error: any) {
      console.error('Erreur connexion démo:', error);
      toast.error(error?.message || 'Compte démo non disponible');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <Leaf className="h-12 w-12 text-green-500" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bon retour sur ECOLOJIA !
          </h1>
          <p className="text-gray-600">
            Connectez-vous pour continuer votre parcours santé
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-primary transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou</span>
              </div>
            </div>

            {/* Bouton démo */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              🎯 Essayer avec le compte démo
            </button>
          </form>

          {/* Lien inscription */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Pas encore de compte ?{' '}
              <Link
                to="/register"
                className="text-primary font-medium hover:text-primary"
              >
                Créer un compte gratuit
              </Link>
            </p>
          </div>
        </div>

        {/* Features reminder */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <div className="text-2xl mb-2">🔬</div>
            <p className="text-sm text-gray-600">Analyse IA</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm text-gray-600">Dashboard</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <div className="text-2xl mb-2">💬</div>
            <p className="text-sm text-gray-600">Chat Expert</p>
          </div>
        </div>

        {/* Identifiants de test */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-sm text-blue-800 font-semibold mb-2">🧪 Comptes de test disponibles :</p>
          <div className="text-xs text-blue-700">
            <p>Premium : demo@ecolojia.app / demo123</p>
            <p>Gratuit : test@example.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
