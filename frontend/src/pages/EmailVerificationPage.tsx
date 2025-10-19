import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmailValidation } from '../hooks/useEmailValidation';
import { useAuthContext } from '../Contexts/AuthContext';

export const EmailVerificationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { verifyEmail, isLoading, error } = useEmailValidation();
  const { refreshUser } = useAuthContext();
  
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setVerificationResult({
          success: false,
          message: 'Token de verification manquant'
        });
        return;
      }

      try {
        const result = await verifyEmail(token);
        setVerificationResult(result);
        
        if (result.success) {
          // Actualiser les donnees utilisateur
          await refreshUser();
          
          // Rediriger vers dashboard apres 3 secondes
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-lg font-medium text-gray-900">
                Verification en cours...
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
                <div className="text-green-500 text-6xl mb-4">aƒ'¦aâ‚¬Å“aa'šÂ¬‚Â¦</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Email verifie !
                </h2>
                <p className="text-gray-600 mb-6">
                  {verificationResult.message}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Redirection automatique vers votre dashboard...
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Acceder au dashboard
                </button>
              </>
            ) : (
              <>
                <div className="text-red-500 text-6xl mb-4">aƒ'š‚Âƒ'¦aâ‚¬â„¢</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Verification echouee
                </h2>
                <p className="text-gray-600 mb-6">
                  {verificationResult?.message || error || 'Erreur inconnue'}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/auth')}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-700"
                  >
                    Retour ƒÆ’†'ƒ'š‚Â  la connexion
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Reessayer
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



