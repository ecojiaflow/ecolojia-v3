// backend/src/services/EmailService.ts
import nodemailer from 'nodemailer';
import { Logger } from '../utils/Logger';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private logger: Logger;
  private fromEmail: string;
  private fromName: string;
  private baseUrl: string;

  constructor(logger: Logger) {
    this.logger = logger;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@ecolojia.com';
    this.fromName = 'ECOLOJIA';
    this.baseUrl = process.env.FRONTEND_URL || 'https://ecolojia.com';
    
    this.setupTransporter();
  }

  private setupTransporter(): void {
    if (process.env.NODE_ENV === 'production') {
      // Configuration SendGrid pour production
      this.transporter = nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    } else {
      // Configuration développement (Ethereal ou SMTP local)
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${this.baseUrl}/verify-email/${token}`;
    
    const htmlContent = this.generateVerificationEmailHTML(name, verificationUrl);
    const textContent = this.generateVerificationEmailText(name, verificationUrl);

    try {
      await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: '🌱 Vérifiez votre email ECOLOJIA',
        text: textContent,
        html: htmlContent
      });

      this.logger.info('Verification email sent successfully', { email });

    } catch (error) {
      this.logger.error('Failed to send verification email', { email, error: error.message });
      throw new Error('Impossible d\'envoyer l\'email de vérification');
    }
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const resetUrl = `${this.baseUrl}/reset-password/${token}`;
    
    const htmlContent = this.generatePasswordResetEmailHTML(name, resetUrl);
    const textContent = this.generatePasswordResetEmailText(name, resetUrl);

    try {
      await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: '🔐 Réinitialisation de votre mot de passe ECOLOJIA',
        text: textContent,
        html: htmlContent
      });

      this.logger.info('Password reset email sent successfully', { email });

    } catch (error) {
      this.logger.error('Failed to send password reset email', { email, error: error.message });
      throw new Error('Impossible d\'envoyer l\'email de réinitialisation');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const htmlContent = this.generateWelcomeEmailHTML(name);
    const textContent = this.generateWelcomeEmailText(name);

    try {
      await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: '🎉 Bienvenue sur ECOLOJIA !',
        text: textContent,
        html: htmlContent
      });

      this.logger.info('Welcome email sent successfully', { email });

    } catch (error) {
      this.logger.error('Failed to send welcome email', { email, error: error.message });
      // Ne pas faire échouer le processus pour l'email de bienvenue
    }
  }

  private generateVerificationEmailHTML(name: string, verificationUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérifiez votre email ECOLOJIA</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌱 ECOLOJIA</h1>
                <p>Votre expert IA pour une consommation éclairée</p>
            </div>
            
            <div class="content">
                <h2>Bonjour ${name} !</h2>
                
                <p>Merci de vous être inscrit sur <strong>ECOLOJIA</strong>, votre nouvelle plateforme d'analyse de produits alimentée par IA scientifique.</p>
                
                <p>Pour commencer à analyser vos produits et accéder à toutes nos fonctionnalités, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">✅ Vérifier mon email</a>
                </div>
                
                <p><strong>Ce que vous allez découvrir avec ECOLOJIA :</strong></p>
                <ul>
                    <li>🔬 <strong>Analyse scientifique avancée</strong> : Classification NOVA, détection ultra-transformation</li>
                    <li>🤖 <strong>Chat IA Expert</strong> : 5 questions gratuites par jour avec notre nutritionniste IA</li>
                    <li>🏆 <strong>Score santé 0-100</strong> : Évaluation instantanée de vos produits</li>
                    <li>🌿 <strong>Alternatives saines</strong> : Suggestions personnalisées</li>
                </ul>
                
                <p>Ce lien est valable pendant <strong>24 heures</strong>.</p>
                
                <p>Si vous n'arrivez pas à cliquer sur le bouton, copiez et collez cette URL dans votre navigateur :</p>
                <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
            </div>
            
            <div class="footer">
                <p>Vous recevez cet email car vous avez créé un compte sur ecolojia.com</p>
                <p>Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.</p>
                <p>© 2024 ECOLOJIA - Consommation éclairée par IA</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateVerificationEmailText(name: string, verificationUrl: string): string {
    return `
Bonjour ${name} !

Merci de vous être inscrit sur ECOLOJIA, votre nouvelle plateforme d'analyse de produits alimentée par IA scientifique.

Pour commencer à analyser vos produits et accéder à toutes nos fonctionnalités, veuillez vérifier votre adresse email en cliquant sur ce lien :

${verificationUrl}

Ce que vous allez découvrir avec ECOLOJIA :
- Analyse scientifique avancée : Classification NOVA, détection ultra-transformation
- Chat IA Expert : 5 questions gratuites par jour avec notre nutritionniste IA
- Score santé 0-100 : Évaluation instantanée de vos produits
- Alternatives saines : Suggestions personnalisées

Ce lien est valable pendant 24 heures.

Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.

Merci !
L'équipe ECOLOJIA
    `;
  }

  private generatePasswordResetEmailHTML(name: string, resetUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation mot de passe ECOLOJIA</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 ECOLOJIA</h1>
                <p>Réinitialisation de mot de passe</p>
            </div>
            
            <div class="content">
                <h2>Bonjour ${name},</h2>
                
                <p>Vous avez demandé la réinitialisation de votre mot de passe ECOLOJIA.</p>
                
                <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">🔑 Réinitialiser mon mot de passe</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important :</strong>
                    <ul>
                        <li>Ce lien est valable pendant <strong>1 heure seulement</strong></li>
                        <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                        <li>Votre mot de passe actuel reste inchangé tant que vous ne cliquez pas sur le lien</li>
                    </ul>
                </div>
                
                <p>Si le bouton ne fonctionne pas, copiez et collez cette URL dans votre navigateur :</p>
                <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
            </div>
            
            <div class="footer">
                <p>Vous recevez cet email car une réinitialisation de mot de passe a été demandée pour votre compte ECOLOJIA.</p>
                <p>Si vous n'êtes pas à l'origine de cette demande, votre compte est peut-être compromis. Contactez-nous immédiatement.</p>
                <p>© 2024 ECOLOJIA</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generatePasswordResetEmailText(name: string, resetUrl: string): string {
    return `
Bonjour ${name},

Vous avez demandé la réinitialisation de votre mot de passe ECOLOJIA.

Cliquez sur ce lien pour créer un nouveau mot de passe :
${resetUrl}

IMPORTANT :
- Ce lien est valable pendant 1 heure seulement
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Votre mot de passe actuel reste inchangé tant que vous ne cliquez pas sur le lien

Si vous n'êtes pas à l'origine de cette demande, votre compte est peut-être compromis. Contactez-nous immédiatement.

L'équipe ECOLOJIA
    `;
  }

  private generateWelcomeEmailHTML(name: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur ECOLOJIA !</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .feature { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #8b5cf6; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Bienvenue sur ECOLOJIA !</h1>
                <p>Votre voyage vers une consommation éclairée commence maintenant</p>
            </div>
            
            <div class="content">
                <h2>Félicitations ${name} ! 🌱</h2>
                
                <p>Votre compte ECOLOJIA est maintenant actif. Vous faites désormais partie de la communauté de consommateurs éclairés qui utilisent l'IA pour faire de meilleurs choix.</p>
                
                <div class="feature">
                    <h3>🔬 Votre IA Scientifique Gratuite</h3>
                    <p>Analysez instantanément vos produits avec nos algorithmes basés sur INSERM, ANSES et EFSA. Classification NOVA, détection ultra-transformation, score santé 0-100.</p>
                </div>
                
                <div class="feature">
                    <h3>🤖 Chat Expert IA (5 questions/jour)</h3>
                    <p>Posez vos questions à notre nutritionniste IA. "Ce produit convient-il aux enfants ?", "Quelles alternatives plus saines ?" - Réponses personnalisées garanties.</p>
                </div>
                
                <div class="feature">
                    <h3>🏆 Premium à découvrir</h3>
                    <p>Questions IA illimitées, coaching personnalisé, dashboard analytics complet. Essai gratuit disponible !</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${this.baseUrl}/scanner" class="button">🚀 Commencer à scanner</a>
                </div>
                
                <p><strong>Premiers pas conseillés :</strong></p>
                <ol>
                    <li>Scannez un produit de votre cuisine</li>
                    <li>Découvrez son score santé et ses analyses</li>
                    <li>Posez une question à notre IA Expert</li>
                    <li>Explorez les alternatives suggérées</li>
                </ol>
                
                <p>Des questions ? Notre équipe est là pour vous aider !</p>
            </div>
            
            <div class="footer">
                <p>Merci de faire confiance à ECOLOJIA pour votre parcours vers une consommation plus consciente.</p>
                <p>© 2024 ECOLOJIA - L'IA au service de votre santé</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateWelcomeEmailText(name: string): string {
    return `
Félicitations ${name} ! 

Votre compte ECOLOJIA est maintenant actif. Vous faites désormais partie de la communauté de consommateurs éclairés qui utilisent l'IA pour faire de meilleurs choix.

VOTRE IA SCIENTIFIQUE GRATUITE :
Analysez instantanément vos produits avec nos algorithmes basés sur INSERM, ANSES et EFSA. Classification NOVA, détection ultra-transformation, score santé 0-100.

CHAT EXPERT IA (5 questions/jour) :
Posez vos questions à notre nutritionniste IA. "Ce produit convient-il aux enfants ?", "Quelles alternatives plus saines ?" - Réponses personnalisées garanties.

PREMIUM À DÉCOUVRIR :
Questions IA illimitées, coaching personnalisé, dashboard analytics complet. Essai gratuit disponible !

Premiers pas conseillés :
1. Scannez un produit de votre cuisine
2. Découvrez son score santé et ses analyses  
3. Posez une question à notre IA Expert
4. Explorez les alternatives suggérées

Commencez dès maintenant : ${this.baseUrl}/scanner

Des questions ? Notre équipe est là pour vous aider !

Merci de faire confiance à ECOLOJIA pour votre parcours vers une consommation plus consciente.

L'équipe ECOLOJIA
    `;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.info('Email service connection successful');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed', { error: error.message });
      return false;
    }
  }
}