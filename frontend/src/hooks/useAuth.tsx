// PATH: frontend/src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../auth/context/AuthContext';
import { AuthContextType } from '../auth/types/AuthTypes';

// ✅ Hook principal
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }

  return context;
};

// ✅ Export optionnel des utilitaires si besoin plus tard
export { AuthContext };
