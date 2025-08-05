// PATH: backend/src/auth/services/EmailValidationService.ts
// // import { PrismaClient } from '@prisma/client';
import { emailService } from './EmailService'; // ✅ Import corrigé

const prisma = null // new PrismaClient();

export interface ValidationResult {
  success: boolean;
  message: string;
  data?: any;
}

export class EmailValidationService {
  
  /**
   * Vérifier un token de validation email
   */
  async verifyToken(token: string): Promise<ValidationResult> {
    try {
      console.log('🔍 Vérification token email:', token);
      
      if (!token || token.length < 32) {
        return {
          success: false,
          message: 'Token de validation invalide'
        };
      }

      // Chercher token dans la base
      // const verification = await prisma.emailVerification.findFirst({
 // PRISMA DISABLED
        where: {
          token,
          verified: false,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              emailVerified: true
            }
          }
        }
      });

      if (!verification) {
        console.log('❌ Token non trouvé ou expiré');
        return {
          success: false,
          message: 'Token de validation invalide ou expiré. Veuillez demander un nouveau lien de validation.'
        };
      }

      if (!verification.user) {
        console.log('❌ Utilisateur associé au token non trouvé');
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      if (verification.user.emailVerified) {
        console.log('✅ Email déjà vérifié pour:', verification.user.email);
        return {
          success: true,
          message: 'Votre email est déjà vérifié',
          data: { user: verification.user }
        };
      }

      // Transaction pour marquer comme vérifié
      // // await prisma.$transaction(async (tx) => {
 // PRISMA DISABLED // PRISMA DISABLED
        // Marquer token comme utilisé
        await tx.emailVerification.update({
          where: { id: verification.id },
          data: { 
            verified: true,
            updatedAt: new Date()
          }
        });

        // Marquer utilisateur comme vérifié
        await tx.user.update({
          where: { id: verification.user!.id },
          data: { 
            emailVerified: true,
            updatedAt: new Date()
          }
        });
      });

      console.log('✅ Email vérifié avec succès pour:', verification.user.email);
      
      return {
        success: true,
        message: `Email vérifié avec succès ! Bienvenue ${verification.user.name}.`,
        data: { 
          user: {
            ...verification.user,
            emailVerified: true
          }
        }
      };

    } catch (error: any) {
      console.error('❌ Erreur vérification email token:', error);
      return {
        success: false,
        message: 'Erreur lors de la vérification. Veuillez réessayer.'
      };
    }
  }

  /**
   * Renvoyer un email de validation
   */
  async resendVerificationEmail(email: string): Promise<ValidationResult> {
    try {
      console.log('📧 Renvoi email de validation pour:', email);

      if (!this.isValidEmail(email)) {
        return {
          success: false,
          message: 'Adresse email invalide'
        };
      }

      // Chercher utilisateur
      // const user = await prisma.user.findUnique({
 // PRISMA DISABLED
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true
        }
      });

      if (!user) {
        // Sécurité : ne pas révéler si l'email existe ou non
        return {
          success: true,
          message: 'Si cet email correspond à un compte ECOLOJIA, un nouveau lien de validation sera envoyé.'
        };
      }

      if (user.emailVerified) {
        return {
          success: false,
          message: 'Cet email est déjà vérifié'
        };
      }

      // Vérifier limite de renvoi (max 3 par heure)
      // const recentVerifications = await prisma.emailVerification.count({
 // PRISMA DISABLED
        where: {
          email: email.toLowerCase(),
          createdAt: {
            gt: new Date(Date.now() - 60 * 60 * 1000) // 1 heure
          }
        }
      });

      if (recentVerifications >= 3) {
        return {
          success: false,
          message: 'Limite de renvoi atteinte. Veuillez attendre une heure avant de demander un nouveau lien.'
        };
      }

      // Invalider anciens tokens non utilisés
      // await prisma.emailVerification.updateMany({
 // PRISMA DISABLED
        where: {
          email: email.toLowerCase(),
          verified: false
        },
        data: { verified: true } // Les marquer comme "utilisés" pour les invalider
      });

      // Envoyer nouveau email
      const emailSent = await emailService.sendVerificationEmail(
        user.id,
        user.email,
        user.name
      );

      if (!emailSent) {
        return {
          success: false,
          message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
        };
      }

      console.log('✅ Email de validation renvoyé à:', email);

      return {
        success: true,
        message: 'Un nouveau lien de validation a été envoyé à votre adresse email.'
      };

    } catch (error: any) {
      console.error('❌ Erreur renvoi email validation:', error);
      return {
        success: false,
        message: 'Erreur lors du renvoi. Veuillez réessayer.'
      };
    }
  }

  /**
   * Obtenir le statut de validation d'un email
   */
  async getValidationStatus(email: string): Promise<ValidationResult> {
    try {
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          message: 'Adresse email invalide'
        };
      }

      // const user = await prisma.user.findUnique({
 // PRISMA DISABLED
        where: { email: email.toLowerCase() },
        select: {
          email: true,
          emailVerified: true,
          createdAt: true
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'Aucun compte trouvé avec cet email'
        };
      }

      return {
        success: true,
        message: 'Statut récupéré',
        data: {
          email: user.email,
          verified: user.emailVerified,
          accountCreated: user.createdAt
        }
      };

    } catch (error: any) {
      console.error('❌ Erreur récupération statut:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération du statut'
      };
    }
  }

  // === MÉTHODES UTILITAIRES ===

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const emailValidationService = new EmailValidationService();

