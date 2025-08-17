// PATH: frontend/src/auth/components/RegisterForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Check, X, ArrowRight } from 'lucide-react';

interface RegisterFormProps {
  onSuccessa: () => void;
  onSwitchToLogina: () => void;
}

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const criteria = [
    { label: 'Au moins 6 caracteres', met: password.length >= 6 },
    { label: 'Une majuscule', met: /[A-Z]/.test(password) },
    { label: 'Une minuscule', met: /[a-z]/.test(password) },
    { label: 'Un chiffre', met: /[0-9]/.test(password) }
  ];

  const strength = criteri?.filter(c => c.met).length;
  const colors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${colors[strength]}`} style={{ width: `${(strength / 4) * 100}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {criteri?.map((c, i) => (
          <div key={i} className="flex items-center text-xs">
            {c.met ? <Check className="w-3 h-3 text-green-500 mr-1" /> : <X className="w-3 h-3 text-gray-400 mr-1" />}
            <span className={c.met ? 'text-green-600' : 'text-gray-500'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name];
      setValidationErrors(newErrors);
    }
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formDat?.firstName) errors.firstName = 'Le prenom est requis';
    if (!formDat?.lastName) errors.lastName = 'Le nom est requis';
    if (!formDat?.email) errors.email = 'L\'email est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formDat?.email)) errors.email = 'Email invalide';
    if (!formDat?.password) errors.password = 'Le mot de passe est requis';
    else if (formDat?.password.length < 6) errors.password = 'Min. 6 caracteres';
    if (!formDat?.confirmPassword) errors.confirmPassword = 'Confirmez le mot de passe';
    else if (formDat?.password !== formDat?.confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!acceptTerms) errors.terms = 'Vous devez accepter les conditions';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      await register({
        email: formDat?.email,
        password: formDat?.password,
        firstName: formDat?.firstName,
        lastName: formDat?.lastName,
        name: `${formDat?.firstName} ${formDat?.lastName}`,
        acceptTerms
      });
      onSuccess?.();
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Creer votre compte gratuit</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prenom</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                name="firstName" 
                value={formDat?.firstName} 
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent ${
                  validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
                }`} 
                placeholder="Jean"
              />
            </div>
            {validationErrors.firstName && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.firstName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                name="lastName" 
                value={formDat?.lastName} 
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent ${
                  validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Dupont"
              />
            </div>
            {validationErrors.lastName && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.lastName}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              name="email" 
              type="email" 
              value={formDat?.email} 
              onChange={handleChange}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent ${
                validationErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="jean.dupont@example.com"
            />
          </div>
          {validationErrors.email && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.email}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              name="password" 
              type={showPassword ? 'text' : 'password'} 
              value={formDat?.password} 
              onChange={handleChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent ${
                validationErrors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="aaaaaaaaaaaaaaaa"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <PasswordStrength password={formDat?.password} />
          {validationErrors.password && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.password}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              name="confirmPassword" 
              type={showConfirmPassword ? 'text' : 'password'} 
              value={formDat?.confirmPassword} 
              onChange={handleChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent ${
                validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="aaaaaaaaaaaaaaaa"
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.confirmPassword}</p>
          )}
        </div>
        
        <div>
          <label className="flex items-start">
            <input 
              type="checkbox" 
              checked={acceptTerms} 
              onChange={e => setAcceptTerms(e.target.checked)} 
              className="mt-1 w-4 h-4 text-[#7DDE4A] border-gray-300 rounded focus:ring-[#7DDE4A]"
            />
            <span className="ml-2 text-sm text-gray-600">
              J'accepte les <a href="/terms" className="text-[#7DDE4A] hover:underline">conditions d'utilisation</a> et 
              la <a href="/privacy" className="text-[#7DDE4A] hover:underline">politique de confidentialite</a>
            </span>
          </label>
          {validationErrors.terms && (
            <p className="text-red-600 text-xs mt-1 ml-6">{validationErrors.terms}</p>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-[#7DDE4A] hover:bg-[#6BC93B] text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span>Creation en cours...</span>
          ) : (
            <>
              Creer mon compte
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </button>
      </form>
      
      {onSwitchToLogin && (
        <p className="text-center text-sm text-gray-600 mt-6">
          Dej inscrit ? 
          <button 
            onClick={onSwitchToLogin}
            className="text-[#7DDE4A] hover:underline ml-1 font-medium"
          >
            Se connecter
          </button>
        </p>
      )}
    </div>
  );
};

export default RegisterForm;


