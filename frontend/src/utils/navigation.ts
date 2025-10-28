// PATH: frontend/src/utils/navigation.ts

import { Location } from 'react-router-dom';

export const saveReturnUrl = (url: string) => {
  if (url.includes('/login') || url.includes('/register')) {
    return;
  }
  sessionStorage.setItem('returnUrl', url);
};

export const getReturnUrl = (location?: Location): string => {
  if (location) {
    const params = new URLSearchParams(location.search);
    const returnUrl = params.get('returnUrl');
    if (returnUrl) {
      return decodeURIComponent(returnUrl);
    }
  }
  
  const storedUrl = sessionStorage.getItem('returnUrl');
  if (storedUrl) {
    sessionStorage.removeItem('returnUrl');
    return storedUrl;
  }
  
  return '/dashboard';
};

export const clearReturnUrl = () => {
  sessionStorage.removeItem('returnUrl');
};