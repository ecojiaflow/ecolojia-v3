// frontend/src/auth/hooks/useAuth.ts

// ✅ SOLUTION: Import depuis le contexte qui exporte déjà useAuth
export { useAuth } from '../context/AuthContext';

// ✅ Export par défaut pour compatibilité
import { useAuth } from '../context/AuthContext';
export default useAuth;