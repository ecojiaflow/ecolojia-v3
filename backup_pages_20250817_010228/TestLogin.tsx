// PATH: frontend/src/pages/TestLogin.tsx
// Page de connexion rapide pour tester

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

export default function TestLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Connexion avec compte de test
  const handleTestLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Essayer de se connecter avec un compte test
      const response = await apiClient.post('/api/auth/login', {
        email: 'test@ecolojia.com',
        password: 'test123'
      });

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken || '');
        localStorage.setItem('userId', response.data.userId || '');
        localStorage.setItem('userEmail', 'test@ecolojia.com');
        
        console.log('ÃƒÆ’Ã‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ã¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢Ã¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Connexion rÃƒÆ’Ã‚Â©ussie !');
        navigate('/scan');
      }
    } catch (err: any) {
      console.error('ÃƒÆ’Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦Ã¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Erreur connexion:', err);
      
      // Si le compte test n'existe pas, crÃƒÆ’Ã‚Â©er un token local
      if (err.status === 404 || err.status === 401) {
        console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢Ã¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ CrÃƒÆ’Ã‚Â©ation d\'un token local de test...');
        
        // Token de test local
        const testToken = 'test-token-' + Date.now();
        localStorage.setItem('token', testToken);
        localStorage.setItem('userId', 'test-user-123');
        localStorage.setItem('userEmail', 'test@ecolojia.com');
        localStorage.setItem('plan', 'free');
        
        navigate('/scan');
      } else {
        setError('Erreur de connexion : ' + (err.message || 'Serveur indisponible'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Connexion sans backend (mode dÃƒÆ’Ã‚Â©mo)
  const handleDemoMode = () => {
    console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ Mode dÃƒÆ’Ã‚Â©mo activÃƒÆ’Ã‚Â©');
    
    // CrÃƒÆ’Ã‚Â©er un token de dÃƒÆ’Ã‚Â©monstration
    const demoToken = 'demo-token-' + Date.now();
    localStorage.setItem('token', demoToken);
    localStorage.setItem('userId', 'demo-user-123');
    localStorage.setItem('userEmail', 'demo@ecolojia.com');
    localStorage.setItem('plan', 'premium'); // Premium en dÃƒÆ’Ã‚Â©mo
    localStorage.setItem('demoMode', 'true');
    
    navigate('/scan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ã¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ ECOLOJIA
          </h1>
          <p className="text-gray-600">
            Connexion rapide pour tester
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Bouton connexion avec backend */}
          <button
            onClick={handleTestLogin}
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connexion...
              </>
            ) : (
              <>
                ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢Ã¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Se connecter avec le compte test
              </>
            )}
          </button>

          {/* SÃƒÆ’Ã‚Â©parateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">OU</span>
            </div>
          </div>

          {/* Bouton mode dÃƒÆ’Ã‚Â©mo */}
          <button
            onClick={handleDemoMode}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ Mode dÃƒÆ’Ã‚Â©monstration (sans backend)
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <strong>Note :</strong> En mode dÃƒÆ’Ã‚Â©mo, les analyses sont simulÃƒÆ’Ã‚Â©es localement.
            Pour une expÃƒÆ’Ã‚Â©rience complÃƒÆ’Ã‚Â¨te, assurez-vous que le backend est lancÃƒÆ’Ã‚Â©.
          </p>
        </div>

        {/* Info dÃƒÆ’Ã‚Â©veloppeur */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Backend URL: {import.meta.env.VITE_API_URL || 'http://localhost:5001'}
          </p>
        </div>
      </div>
    </div>
  );
}


