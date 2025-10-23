// frontend/src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from './Contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  // Afficher un loader pendant la verification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">a</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ECOLOJIA</h2>
          <LoadingSpinner message="Verification de votre session..." />
        </div>
      </div>
    );
  }

  // Si non authentifie, rediriger vers la page de connexion
  if (!isAuthenticated) {
    // Sauvegarder la page demandee pour redirection apres connexion
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Si authentifie, afficher les routes enfants
  return <Outlet />;
}


