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
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@ecoloji?.com';
    this.fromName = 'ECOLOJIA';
    this.baseUrl = process.env.FRONTEND_URL || 'https://ecoloji?.com';
    
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
      // Configuration developpement (Ethereal ou SMTP local)
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
        subject: 'Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â± Verifiez votre email ECOLOJIA',
        text: textContent,
        html: htmlContent
      });

      this.logger.info('Verification email sent successfully', { email });

    } catch (error) {
      this.logger.error('Failed to send verification email', { email, error: error.message });
      throw new Error('Impossible d\'envoyer l\'email de verification');
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
        subject: 'Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â Reinitialisation de votre mot de passe ECOLOJIA',
        text: textContent,
        html: htmlContent
      });

      this.logger.info('Password reset email sent successfully', { email });

    } catch (error) {
      this.logger.error('Failed to send password reset email', { email, error: error.message });
      throw new Error('Impossible d\'envoyer l\'email de reinitialisation');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const htmlContent = this.generateWelcomeEmailHTML(name);
    const textContent = this.generateWelcomeEmailText(name);

    try {
      await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â½aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â° Bienvenue sur ECOLOJIA !',
        text: textContent,
        html: htmlContent
      });

      this.logger.info('Welcome email sent successfully', { email });

    } catch (error) {
      this.logger.error('Failed to send welcome email', { email, error: error.message });
      // Ne pas faire echouer le processus pour l'email de bienvenue
    }
  }

  private generateVerificationEmailHTML(name: string, verificationUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifiez votre email ECOLOJIA</title>
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
                <h1>Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â± ECOLOJIA</h1>
                <p>Votre expert IA pour une consommation eclairee</p>
            </div>
            
            <div class="content">
                <h2>Bonjour ${name} !</h2>
                
                <p>Merci de vous etre inscrit sur <strong>ECOLOJIA</strong>, votre nouvelle plateforme d'analyse de produits alimentee par IA scientifique.</p>
                
                <p>Pour commencer Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  analyser vos produits et acceder Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  toutes nos fonctionnalites, veuillez verifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Verifier mon email</a>
                </div>
                
                <p><strong>Ce que vous allez decouvrir avec ECOLOJIA :</strong></p>
                <ul>
                    <li>Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â¬ <strong>Analyse scientifique avancee</strong> : Classification NOVA, detection ultra-transformation</li>
                    <li>Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â¤aaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â€šÂ¬Ã…â€œ <strong>Chat IA Expert</strong> : 5 questions gratuites par jour avec notre nutritionniste IA</li>
                    <li>Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â  <strong>Score sante 0-100</strong> : Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°valuation instantanee de vos produits</li>
                    <li>Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â¿ <strong>Alternatives saines</strong> : Suggestions personnalisees</li>
                </ul>
                
                <p>Ce lien est valable pendant <strong>24 heures</strong>.</p>
                
                <p>Si vous n'arrivez pas Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  cliquer sur le bouton, copiez et collez cette URL dans votre navigateur :</p>
                <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
            </div>
            
            <div class="footer">
                <p>Vous recevez cet email car vous avez cree un compte sur ecoloji?.com</p>
                <p>Si vous n'etes pas Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  l'origine de cette inscription, vous pouvez ignorer cet email.</p>
                <p>Æ’Ã†â€™aÃ¢â€šÂ¬Ã…Â¡â€šÃ‚Â© 2024 ECOLOJIA - Consommation eclairee par IA</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateVerificationEmailText(name: string, verificationUrl: string): string {
    return `
Bonjour ${name} !

Merci de vous etre inscrit sur ECOLOJIA, votre nouvelle plateforme d'analyse de produits alimentee par IA scientifique.

Pour commencer Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  analyser vos produits et acceder Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  toutes nos fonctionnalites, veuillez verifier votre adresse email en cliquant sur ce lien :

${verificationUrl}

Ce que vous allez decouvrir avec ECOLOJIA :
- Analyse scientifique avancee : Classification NOVA, detection ultra-transformation
- Chat IA Expert : 5 questions gratuites par jour avec notre nutritionniste IA
- Score sante 0-100 : Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°valuation instantanee de vos produits
- Alternatives saines : Suggestions personnalisees

Ce lien est valable pendant 24 heures.

Si vous n'etes pas Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  l'origine de cette inscription, vous pouvez ignorer cet email.

Merci !
L'equipe ECOLOJIA
    `;
  }

  private generatePasswordResetEmailHTML(name: string, resetUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reinitialisation mot de passe ECOLOJIA</title>
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
                <h1>Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â ECOLOJIA</h1>
                <p>Reinitialisation de mot de passe</p>
            </div>
            
            <div class="content">
                <h2>Bonjour ${name},</h2>
                
                <p>Vous avez demande la reinitialisation de votre mot de passe ECOLOJI?.</p>
                
                <p>Cliquez sur le bouton ci-dessous pour creer un nouveau mot de passe :</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€¹Ã…â€œ Reinitialiser mon mot de passe</a>
                </div>
                
                <div class="warning">
                    <strong>aÆ’Ã¢â‚¬Â¦â€šÃ‚Â¡Æ’Ã¢â‚¬Å¡â€šÃ‚Â Æ’Ã‚Â¯Æ’Ã¢â‚¬Å¡â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â Important :</strong>
                    <ul>
                        <li>Ce lien est valable pendant <strong>1 heure seulement</strong></li>
                        <li>Si vous n'avez pas demande cette reinitialisation, ignorez cet email</li>
                        <li>Votre mot de passe actuel reste inchange tant que vous ne cliquez pas sur le lien</li>
                    </ul>
                </div>
                
                <p>Si le bouton ne fonctionne pas, copiez et collez cette URL dans votre navigateur :</p>
                <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
            </div>
            
            <div class="footer">
                <p>Vous recevez cet email car une reinitialisation de mot de passe ? ete demandee pour votre compte ECOLOJI?.</p>
                <p>Si vous n'etes pas Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  l'origine de cette demande, votre compte est peut-etre compromis. Contactez-nous immediatement.</p>
                <p>Æ’Ã†â€™aÃ¢â€šÂ¬Ã…Â¡â€šÃ‚Â© 2024 ECOLOJIA</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generatePasswordResetEmailText(name: string, resetUrl: string): string {
    return `
Bonjour ${name},

Vous avez demande la reinitialisation de votre mot de passe ECOLOJI?.

Cliquez sur ce lien pour creer un nouveau mot de passe :
${resetUrl}

IMPORTANT :
- Ce lien est valable pendant 1 heure seulement
- Si vous n'avez pas demande cette reinitialisation, ignorez cet email
- Votre mot de passe actuel reste inchange tant que vous ne cliquez pas sur le lien

Si vous n'etes pas Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  l'origine de cette demande, votre compte est peut-etre compromis. Contactez-nous immediatement.

L'equipe ECOLOJIA
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
                <h1>Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â½aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â° Bienvenue sur ECOLOJIA !</h1>
                <p>Votre voyage vers une consommation eclairee commence maintenant</p>
            </div>
            
            <div class="content">
                <h2>Felicitations ${name} ! Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â±</h2>
                
                <p>Votre compte ECOLOJIA est maintenant actif. Vous faites desormais partie de la communaute de consommateurs eclaires qui utilisent l'IA pour faire de meilleurs choix.</p>
                
                <div class="feature">
                    <h3>Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂÆ’Ã¢â‚¬Å¡â€šÃ‚Â¬ Votre IA Scientifique Gratuite</h3>
                    <p>Analysez instantanement vos produits avec nos algorithmes bases sur INSERM, ANSES et EFS?. Classification NOVA, detection ultra-transformation, score sante 0-100.</p>
                </div>
                
                <div class="feature">
                    <h3>Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â¤aaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â€šÂ¬Ã…â€œ Chat Expert IA (5 questions/jour)</h3>
                    <p>Posez vos questions Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  notre nutritionniste I?. "Ce produit convient-il aux enfants ?", "Quelles alternatives plus saines ?" - Reponses personnalisees garanties.</p>
                </div>
                
                <div class="feature">
                    <h3>Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â  Premium Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  decouvrir</h3>
                    <p>Questions IA illimitees, coaching personnalise, dashboard analytics complet. Essai gratuit disponible !</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${this.baseUrl}/scanner" class="button">Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â¡aÃ¢â‚¬Å¡Ã‚Â¬ Commencer Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  scanner</a>
                </div>
                
                <p><strong>Premiers pas conseilles :</strong></p>
                <ol>
                    <li>Scannez un produit de votre cuisine</li>
                    <li>Decouvrez son score sante et ses analyses</li>
                    <li>Posez une question Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  notre IA Expert</li>
                    <li>Explorez les alternatives suggerees</li>
                </ol>
                
                <p>Des questions ? Notre equipe est lÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  pour vous aider !</p>
            </div>
            
            <div class="footer">
                <p>Merci de faire confiance Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  ECOLOJIA pour votre parcours vers une consommation plus consciente.</p>
                <p>Æ’Ã†â€™aÃ¢â€šÂ¬Ã…Â¡â€šÃ‚Â© 2024 ECOLOJIA - L'IA au service de votre sante</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateWelcomeEmailText(name: string): string {
    return `
Felicitations ${name} ! 

Votre compte ECOLOJIA est maintenant actif. Vous faites desormais partie de la communaute de consommateurs eclaires qui utilisent l'IA pour faire de meilleurs choix.

VOTRE IA SCIENTIFIQUE GRATUITE :
Analysez instantanement vos produits avec nos algorithmes bases sur INSERM, ANSES et EFS?. Classification NOVA, detection ultra-transformation, score sante 0-100.

CHAT EXPERT IA (5 questions/jour) :
Posez vos questions Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  notre nutritionniste I?. "Ce produit convient-il aux enfants ?", "Quelles alternatives plus saines ?" - Reponses personnalisees garanties.

PREMIUM Æ’Ã†â€™â€ Ã¢â‚¬â„¢aÃ¢â‚¬Å¡Ã‚Â¬ DÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°COUVRIR :
Questions IA illimitees, coaching personnalise, dashboard analytics complet. Essai gratuit disponible !

Premiers pas conseilles :
1. Scannez un produit de votre cuisine
2. Decouvrez son score sante et ses analyses  
3. Posez une question Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  notre IA Expert
4. Explorez les alternatives suggerees

Commencez des maintenant : ${this.baseUrl}/scanner

Des questions ? Notre equipe est lÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  pour vous aider !

Merci de faire confiance Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  ECOLOJIA pour votre parcours vers une consommation plus consciente.

L'equipe ECOLOJIA
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


