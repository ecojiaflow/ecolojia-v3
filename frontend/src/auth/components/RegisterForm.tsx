// PATH: frontend/src/auth/components/RegisterForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, User, Check, X, ArrowRight } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const criteria = [
    { label: 'Au moins 6 caractères', met: password.length >= 6 },
    { label: 'Une majuscule', met: /[A-Z]/.test(password) },
    { label: 'Une minuscule', met: /[a-z]/.test(password) },
    { label: 'Un chiffre', met: /[0-9]/.test(password) }
  ];

  const strength = criteria.filter(c => c.met).length;
  const colors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${colors[strength]}`} style={{ width: `${(strength / 4) * 100}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center text-xs">
            {c.met ? <Check className="w-3 h-3 text-green-500 mr-1" /> : <X className="w-3 h-3 text-gray-400 mr-1" />}
            <span className={c.met ? 'text-green-600' : 'text-gray-500'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register, error, clearError } = useAuth();

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name];
      setValidationErrors(newErrors);
    }
    if (error) clearError();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.firstName) errors.firstName = 'Le prénom est requis';
    if (!formData.lastName) errors.lastName = 'Le nom est requis';
    if (!formData.email) errors.email = 'L’email est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Email invalide';
    if (!formData.password) errors.password = 'Le mot de passe est requis';
    else if (formData.password.length < 6) errors.password = 'Min. 6 caractères';
    if (!formData.confirmPassword) errors.confirmPassword = 'Confirmez le mot de passe';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!acceptTerms) errors.terms = 'Vous devez accepter les conditions';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      onSuccess?.();
    } catch (err) {
      console.error('Register error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Créer votre compte gratuit</h2>
      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prénom</label>
            <input name="firstName" value={formData.firstName} onChange={handleChange}
              className={`w-full border rounded-lg p-3 ${validationErrors.firstName ? 'border-red-500' : 'border-gray-300'}`} />
            {validationErrors.firstName && <p className="text-red-600 text-sm">{validationErrors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nom</label>
            <input name="lastName" value={formData.lastName} onChange={handleChange}
              className={`w-full border rounded-lg p-3 ${validationErrors.lastName ? 'border-red-500' : 'border-gray-300'}`} />
            {validationErrors.lastName && <p className="text-red-600 text-sm">{validationErrors.lastName}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange}
            className={`w-full border rounded-lg p-3 ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
          {validationErrors.email && <p className="text-red-600 text-sm">{validationErrors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Mot de passe</label>
          <div className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
              className={`w-full border rounded-lg p-3 ${validationErrors.password ? 'border-red-500' : 'border-gray-300'}`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <PasswordStrength password={formData.password} />
          {validationErrors.password && <p className="text-red-600 text-sm">{validationErrors.password}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
          <div className="relative">
            <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange}
              className={`w-full border rounded-lg p-3 ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-gray-400">
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {validationErrors.confirmPassword && <p className="text-red-600 text-sm">{validationErrors.confirmPassword}</p>}
        </div>
        <div>
          <label className="flex items-start">
            <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="mt-1" />
            <span className="ml-2 text-sm text-gray-600">
              J'accepte les <a href="/terms" className="text-green-600">conditions d'utilisation</a>
            </span>
          </label>
          {validationErrors.terms && <p className="text-red-600 text-sm">{validationErrors.terms}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-green-500 text-white p-3 rounded-lg">
          {isSubmitting ? 'Création...' : <>Créer mon compte <ArrowRight className="inline ml-2" /></>}
        </button>
      </form>
    </div>
  );
};
