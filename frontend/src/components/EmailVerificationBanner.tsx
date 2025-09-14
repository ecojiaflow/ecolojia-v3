import React, { useState } from 'react';
import { useEmailValidation } from '../hooks/useEmailValidation';
import { useAuthContext } from './Contexts/AuthContext';

export const EmailVerificationBanner: React.FC = () => {
  const { user, refreshUser } = useAuthContext();
  const { resendVerificationEmail, isLoading } = useEmailValidation();
  const [showSuccess, setShowSuccess] = useState(false);

  // Ne pas afficher si pas d'utilisateur, mode demo, ou email dej verifie
  if (!user || user?.email.includes('demo') || user?.emailVerified) {
    return null;
  }

  const handleResendEmail = async () => {
    try {
      await resendVerificationEmail(user.email);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error('Erreur renvoi email:', error);
    }
  };

  if (showSuccess) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-green-400 text-xl">aaaa</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              Email de verification renvoye ! Verifiez votre boite de reception.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-yellow-400 text-xl">a</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Email non verifie
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Verifiez votre email <strong>{user?.email}</strong> pour activer toutes les fonctionnalites.
            </p>
          </div>
          <div className="mt-4">
            <div className="flex space-x-3">
              <button
                onClick={handleResendEmail}
                disabled={isLoading}
                className="bg-yellow-100 px-3 py-2 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 disabled:opacity-50"
              >
                {isLoading ? 'Envoi...' : 'Renvoyer l\'email'}
              </button>
              <button
                onClick={refreshUser}
                className="bg-transparent px-3 py-2 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100"
              >
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


