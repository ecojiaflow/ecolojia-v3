import { apiClient } from './apiClient';

export interface EmailValidationResponse {
  success: boolean;
  message: string;
  userId?: string;
}

export interface SendVerificationRequest {
  email: string;
  name: string;
  userId?: string;
}

class EmailValidationService {
  
  async sendVerificationEmail(data: SendVerificationRequest): Promise<EmailValidationResponse> {
    try {
      const response = await apiClient.post('/email-validation/send', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    }
  }

  async verifyEmail(token: string): Promise<EmailValidationResponse> {
    try {
      const response = await apiClient.get(`/email-validation/verify/${token}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la vérification');
    }
  }

  async resendVerificationEmail(email: string): Promise<EmailValidationResponse> {
    try {
      const response = await apiClient.post('/email-validation/resend', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors du renvoi');
    }
  }
}

export const emailValidationService = new EmailValidationService();