// PATH: frontend/src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../Contexts/AuthContext";
import LoadingSpinner from "./common/LoadingSpinner";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Rediriger vers login si non authentifié
  if (!isAuthenticated) {
    // Sauvegarder la page tentée pour redirection après login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Rendre les routes enfants si authentifié
  return <Outlet />;
};

export default ProtectedRoute;
