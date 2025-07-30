import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmailValidation } from '../hooks/useEmailValidation';
import { useAuth } from '../auth/context/AuthContext';

export const EmailVerificationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { verifyEmail, isLoading, error } = useEmailValidation();
  const { refreshUser } = useAuth();
  
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setVerificationResult({
          success: false,
          message: 'Token de vérification manquant'
        });
        return;
      }

      try {
        const result = await verifyEmail(token);
        setVerificationResult(result);
        
        if (result.success) {
          // Actualiser les données utilisateur
          await refreshUser();
          
          // Rediriger vers dashboard après 3 secondes
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } catch (err) {
        console.error('Verification failed:', err);
      }
    };

    performVerification();
  }, [token, verifyEmail, refreshUser, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h2 className="text-lg font-medium text-gray-900">
                Vérification en cours...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Validation de votre adresse email
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {verificationResult?.success ? (
              <>
                <div className="text-green-500 text-6xl mb-4">✅</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Email vérifié !
                </h2>
                <p className="text-gray-600 mb-6">
                  {verificationResult.message}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Redirection automatique vers votre dashboard...
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Accéder au dashboard
                </button>
              </>
            ) : (
              <>
                <div className="text-red-500 text-6xl mb-4">❌</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Vérification échouée
                </h2>
                <p className="text-gray-600 mb-6">
                  {verificationResult?.message || error || 'Erreur inconnue'}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/auth')}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Retour à la connexion
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Réessayer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;