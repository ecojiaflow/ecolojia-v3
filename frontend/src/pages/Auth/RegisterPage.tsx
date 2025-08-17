import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, 
  CheckCircle, ArrowRight, Shield, Zap, Gift 
} from 'lucide-react';
import authService from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  marketingOptIn: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // aatat du formulaire
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    marketingOptIn: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Prenom
    if (!formdata?.firstName.trim()) {
      newErrors.firstName = 'Le prenom est requis';
    } else if (formdata?.firstName.length < 2) {
      newErrors.firstName = 'Le prenom doit contenir au moins 2 caracteres';
    }

    // Nom
    if (!formdata?.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (formdata?.lastName.length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caracteres';
    }

    // Username
    if (!formdata?.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (formdata?.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caracteres';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formdata?.username)) {
      newErrors.username = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, - et _';
    }

    // Email
    if (!formdata?.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formdata?.email)) {
      newErrors.email = 'Email invalide';
    }

    // Mot de passe
    if (!formdata?.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formdata?.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caracteres';
    } else if (passwordStrength < 2) {
      newErrors.password = 'Le mot de passe est trop faible';
    }

    // Confirmation mot de passe
    if (!formdata?.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (formdata?.password !== formdata?.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Conditions
    if (!formdata?.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions d\'utilisation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calcul de la force du mot de passe
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    setPasswordStrength(Math.min(strength, 4));
  };

  // Gestion des changements
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Calculer la force du mot de passe
    if (name === 'password') {
      calculatePasswordStrength(value);
    }

    // Effacer l'erreur du champ modifie
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await authService.register({
        email: formdata?.email,
        password: formdata?.password,
        username: formdata?.username,
        firstName: formdata?.firstName,
        lastName: formdata?.lastName,
        acceptTerms: formdata?.acceptTerms,
        marketingOptIn: formdata?.marketingOptIn
      });

      toast({
        title: "Inscription reussie !",
        description: "Bienvenue dans la communaute ECOLOJIA",
        variant: "default"
      });

      // Rediriger vers l'onboarding ou le dashboard
      navigate('/onboarding');

    } catch (error: any) {
      console.error('Register error:', error);
      
      // Gestion des erreurs specifiques
      if (error.message.includes('already exists')) {
        if (error.message.includes('email')) {
          setErrors({ email: 'Cet email est dej utilise' });
        } else if (error.message.includes('username')) {
          setErrors({ username: 'Ce nom d\'utilisateur est dej pris' });
        }
      } else {
        setErrors({ general: error.message || 'Erreur lors de l\'inscription' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Couleur de la barre de force
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return 'Faible';
      case 2: return 'Moyen';
      case 3: return 'Bon';
      case 4: return 'Excellent';
      default: return '';
    }
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
            Creer un compte gratuit
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Dej inscrit a{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Se connecter
            </Link>
          </p>
        </div>

        {/* Avantages */}
        <div className="bg-primary-50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-primary-900 mb-2">
            Pourquoi creer un compte a
          </h3>
          <div className="flex items-center text-sm text-primary-700">
            <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>30 analyses gratuites par mois</span>
          </div>
          <div className="flex items-center text-sm text-primary-700">
            <Zap className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Historique et suivi de vos produits</span>
          </div>
          <div className="flex items-center text-sm text-primary-700">
            <Gift className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Recommandations personnalisees</span>
          </div>
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
            {/* Prenom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Prenom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formdata?.firstName}
                  onChange={handleChange}
                  className={`mt-1 appearance-none block w-full px-3 py-2 border ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formdata?.lastName}
                  onChange={handleChange}
                  className={`mt-1 appearance-none block w-full px-3 py-2 border ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nom d'utilisateur
              </label>
              <div className="mt-1 relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formdata?.username}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 pl-10 border ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  placeholder="johndoe"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

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
                  value={formdata?.email}
                  onChange={handleChange}
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
                  required
                  value={formdata?.password}
                  onChange={handleChange}
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
              
              {/* Indicateur de force */}
              {formdata?.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Force du mot de passe</span>
                    <span className="text-xs font-medium text-gray-700">
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formdata?.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 pl-10 pr-10 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  placeholder="aaaaaaaaaaaaaaaa"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-start">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formdata?.acceptTerms}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                J'accepte les{' '}
                <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
                  conditions d'utilisation
                </Link>{' '}
                et la{' '}
                <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
                  politique de confidentialite
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="ml-6 text-sm text-red-600">{errors.acceptTerms}</p>
            )}

            <div className="flex items-start">
              <input
                id="marketingOptIn"
                name="marketingOptIn"
                type="checkbox"
                checked={formdata?.marketingOptIn}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
              />
              <label htmlFor="marketingOptIn" className="ml-2 block text-sm text-gray-900">
                Je souhaite recevoir des conseils et actualites par email (optionnel)
              </label>
            </div>
          </div>

          {/* Bouton d'inscription */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-[#7DDE4A] hover:bg-[#6bc93a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7DDE4A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Creation du compte...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Creer mon compte gratuit
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            En creant un compte, vous acceptez nos{' '}
            <Link to="/terms" className="font-medium text-[#7DDE4A] hover:text-[#6bc93a]">
              conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link to="/privacy" className="font-medium text-[#7DDE4A] hover:text-[#6bc93a]">
              politique de confidentialite
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}



