// PATH: frontend/src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Leaf, ArrowRight, Check } from 'lucide-react';
import { useAuthContext } from '../Contexts/AuthContext';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const passwordRequirements = [
    { regex: /.{8,}/, text: 'Au moins 8 caractères' },
    { regex: /[A-Z]/, text: 'Une majuscule' },
    { regex: /[a-z]/, text: 'Une minuscule' },
    { regex: /[0-9]/, text: 'Un chiffre' }
  ];

  const isPasswordValid = (password: string) => {
    return passwordRequirements.every(req => req.regex.test(password));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!isPasswordValid(formData.password)) {
      toast.error('Le mot de passe ne respecte pas les critères');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (!acceptTerms) {
      toast.error('Veuillez accepter les conditions d\'utilisation');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      
      // Redirection vers l'onboarding après inscription
      navigate('/onboarding');
    } catch (error) {
      // L'erreur est d?jÃ  g?r?e dans le contexte
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <Leaf className="h-12 w-12 text-green-500" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Cr?ez votre compte ECOLOJIA
          </h1>
          <p className="text-gray-600">
            Rejoignez des milliers d'utilisateurs soucieux de leur sant?
          </p>
        </div>

        {/* Avantages */}
        <div className="bg-green-100 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2">
            âœ¨ Avec un compte gratuit :
          </h3>
          <ul className="space-y-1 text-sm text-primary">
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2 flex-shrink-0" />
              30 analyses de produits par mois
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2 flex-shrink-0" />
              Accès au chat IA nutritionnel
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 mr-2 flex-shrink-0" />
              Dashboard personnel de suivi
            </li>
          </ul>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pr?nom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Pr?nom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jean"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Dupont"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            </div>

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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
              
              {/* Critères du mot de passe */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={`text-xs flex items-center ${
                        req.regex.test(formData.password) ? 'text-primary' : 'text-gray-400'
                      }`}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {req.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmer le mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Conditions d'utilisation */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                J'accepte les{' '}
                <Link to="/terms" className="text-primary hover:underline">
                  conditions d'utilisation
                </Link>{' '}
                et la{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  politique de confidentialit?
                </Link>
              </label>
            </div>

            {/* Bouton inscription */}
            <button
              type="submit"
              disabled={isLoading || !acceptTerms}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-primary transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Cr?er mon compte
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Lien connexion */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              D?jÃ  un compte ?{' '}
              <Link
                to="/login"
                className="text-primary font-medium hover:text-primary"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;


