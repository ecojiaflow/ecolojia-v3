// frontend/src/auth/components/RegisterForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, User, Check, X, ArrowRight } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

// Composant pour la force du mot de passe
const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const criteria = [
    { label: 'Au moins 6 caractères', met: password.length >= 6 },
    { label: 'Une majuscule', met: /[A-Z]/.test(password) },
    { label: 'Une minuscule', met: /[a-z]/.test(password) },
    { label: 'Un chiffre', met: /[0-9]/.test(password) },
  ];

  const strength = criteria.filter(c => c.met).length;
  const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${strengthColors[strength]}`}
          style={{ width: `${(strength / 4) * 100}%` }}
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {criteria.map((criterion, index) => (
          <div key={index} className="flex items-center text-xs">
            {criterion.met ? (
              <Check className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <X className="w-3 h-3 text-gray-400 mr-1" />
            )}
            <span className={criterion.met ? 'text-green-600' : 'text-gray-500'}>
              {criterion.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register, error, clearError } = useAuth();
  
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Gestion des changements
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur du champ
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Effacer l'erreur globale
    if (error) {
      clearError();
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name) {
      errors.name = 'Le nom est requis';
    } else if (formData.name.length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }
    
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    if (!acceptTerms) {
      errors.terms = 'Vous devez accepter les conditions d\'utilisation';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        acceptTerms
      });
      
      onSuccess?.();
    } catch (err) {
      // L'erreur est gérée par le contexte
      console.error('Register error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Créer votre compte gratuit
      </h2>

      {/* Avantages compte gratuit */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">🎉 Inclus dans le compte gratuit :</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li className="flex items-center">
            <Check className="w-3 h-3 mr-2" />
            30 analyses de produits par mois
          </li>
          <li className="flex items-center">
            <Check className="w-3 h-3 mr-2" />
            IA scientifique complète (NOVA, INCI, ECO)
          </li>
          <li className="flex items-center">
            <Check className="w-3 h-3 mr-2" />
            Toutes catégories de produits
          </li>
        </ul>
      </div>

      {/* Message d'erreur global */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nom */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nom complet
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                validationErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Jean Dupont"
              disabled={isSubmitting}
            />
          </div>
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                validationErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="votre@email.com"
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        {/* Mot de passe */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                validationErrors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="••••••••"
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
          )}
          <PasswordStrength password={formData.password} />
        </div>

        {/* Confirmation mot de passe */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="••••••••"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
          )}
        </div>

        {/* Conditions d'utilisation */}
        <div>
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-0.5"
            />
            <span className="ml-2 text-sm text-gray-600">
              J'accepte les{' '}
              <a href="/terms" className="text-green-600 hover:text-green-700 font-medium">
                conditions d'utilisation
              </a>{' '}
              et la{' '}
              <a href="/privacy" className="text-green-600 hover:text-green-700 font-medium">
                politique de confidentialité
              </a>
            </span>
          </label>
          {validationErrors.terms && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.terms}</p>
          )}
        </div>

        {/* Bouton d'inscription */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Création du compte...
            </>
          ) : (
            <>
              Créer mon compte
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>
      </form>

      {/* Lien vers connexion */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Vous avez déjà un compte ?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-green-600 hover:text-green-700"
          >
            Se connecter
          </button>
        </p>
      </div>

      {/* Note RGPD */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          🔒 Vos données sont protégées conformément au RGPD
        </p>
      </div>
    </div>
  );
};