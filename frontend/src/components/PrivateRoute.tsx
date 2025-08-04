// frontend/src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🌱</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ECOLOJIA</h2>
          <LoadingSpinner message="Vérification de votre session..." />
        </div>
      </div>
    );
  }

  // Si non authentifié, rediriger vers la page de connexion
  if (!isAuthenticated) {
    // Sauvegarder la page demandée pour redirection après connexion
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Si authentifié, afficher les routes enfants
  return <Outlet />;
}