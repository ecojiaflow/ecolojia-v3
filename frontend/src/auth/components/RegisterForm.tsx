import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const criteria = [
    { label: 'Au moins 6 caracteres', test: password.length >= 6 },
    { label: 'Une majuscule', test: /[A-Z]/.test(password) },
    { label: 'Une minuscule', test: /[a-z]/.test(password) },
    { label: 'Un chiffre', test: /[0-9]/.test(password) }
  ];

  const strength = criteria?.filter(c => c.test).length;
  const colors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded ${i < strength ? colors[strength] : colors[0]}`} />
        ))}
      </div>
      <div className="space-y-1">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center text-xs">
            {c.test ? <Check className="w-3 h-3 text-green-500 mr-1" /> : <X className="w-3 h-3 text-gray-400 mr-1" />}
            <span className={c.test ? 'text-green-600' : 'text-gray-500'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};