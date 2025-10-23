// PATH: frontend/src/utils/navigation.ts

/**
 * Sauvegarde l'URL actuelle avant de rediriger vers login
 * Utile pour revenir à la page d'origine après authentification
 */
export const saveReturnUrl = (url: string) => {
  // Ne pas sauvegarder les URLs de login/register
  if (url.includes('/login') || url.includes('/register')) {
    return;
  }
  sessionStorage.setItem('returnUrl', url);
};

/**
 * Récupère et supprime l'URL de retour sauvegardée
 * @returns URL de retour ou '/dashboard' par défaut
 */
export const getReturnUrl = (): string => {
  const url = sessionStorage.getItem('returnUrl');
  sessionStorage.removeItem('returnUrl');
  return url || '/dashboard';
};

/**
 * Nettoie l'URL de retour sauvegardée
 */
export const clearReturnUrl = () => {
  sessionStorage.removeItem('returnUrl');
};