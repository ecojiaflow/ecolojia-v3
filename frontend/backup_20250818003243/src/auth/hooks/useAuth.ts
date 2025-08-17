// frontend/src/auth/hooks/useAuth.ts

// aaaa SOLUTION: Import depuis le contexte qui exporte dej useAuth
export { useAuth } from '../context/AuthContext';

// aaaa Export par defaut pour compatibilite
import { useAuth } from '../context/AuthContext';
export default useAuth;

