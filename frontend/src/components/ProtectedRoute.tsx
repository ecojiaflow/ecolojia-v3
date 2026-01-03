import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../Contexts/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuthContext();

  // Attendre que le chargement soit terminé
  if (loading) {
    return <LoadingSpinner />;
  }

  // Si pas authentifié après chargement, rediriger
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si authentifié, afficher les enfants
  return <Outlet />;
}
