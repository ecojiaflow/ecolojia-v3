import { useState, useCallback } from 'react';
import { emailValidationService, EmailValidationResponse } from '../services/emailValidationService';

export const useEmailValidation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendVerificationEmail = useCallback(async (
    email: string,
    name: string,
    userId?: string
  ): Promise<EmailValidationResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await emailValidationService.sendVerificationEmail({
        email,
        name,
        userId
      });
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'envoi';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (token: string): Promise<EmailValidationResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await emailValidationService.verifyEmail(token);
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la vérification';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendVerificationEmail = useCallback(async (email: string): Promise<EmailValidationResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await emailValidationService.resendVerificationEmail(email);
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du renvoi';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    clearError,
    sendVerificationEmail,
    verifyEmail,
    resendVerificationEmail
  };
};