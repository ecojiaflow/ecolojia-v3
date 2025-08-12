// frontend/src/auth/hooks/useAuth.ts

// âÅ“â€¦ SOLUTION: Import depuis le contexte qui exporte déjÃƒÂ  useAuth
export { useAuth } from '../context/AuthContext';

// âÅ“â€¦ Export par défaut pour compatibilité
import { useAuth } from '../context/AuthContext';
export default useAuth;
