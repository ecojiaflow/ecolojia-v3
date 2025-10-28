import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../Contexts/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthContext();
  
  // ✅ FIX: Vérifier l'authentification AVANT de rediriger
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // ✅ Si authentifié, afficher les enfants
  return <Outlet />;
}
