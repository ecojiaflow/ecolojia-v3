// backend/src/services/emailService.js
// Service d'email minimal pour ECOLOJIA

class EmailService {
  constructor() {
    this.configured = !!(
      process.env.SMTP_USER || 
      process.env.SENDGRID_API_KEY ||
      process.env.RESEND_API_KEY
    );
    
    if (!this.configured) {
      console.log('ðŸ“§ Service email non configure - Mode simulation active');
    }
  }

  async sendEmail(options) {
    const {
      to,
      subject,
      text,
      html,
      template,
      data
    } = options;

    // En developpement ou si pas configure, simuler l'envoi
    if (process.env.NODE_ENV === 'development' || !this.configured) {
      console.log('ðŸ“§ Email simule:');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      if (template) console.log(`   Template: ${template}`);
      
      return {
        success: true,
        messageId: `simulated-${Date.now()}`,
        simulated: true
      };
    }

    // En production, utiliser le service configure
    try {
      // Exemple avec Nodemailer (  adapter selon votre service)
      if (process.env.SMTP_HOST) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const result = await transporter.sendMail({
          from: process.env.SMTP_FROM || 'ECOLOJIA <noreply@ecolojia.app>',
          to,
          subject,
          text,
          html: html || this.generateHtmlFromTemplate(template, data)
        });

        return {
          success: true,
          messageId: result.messageId
        };
      }

      // Fallback simulation si aucun service configure
      return this.sendEmail({ ...options, NODE_ENV: 'development' });

    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw error;
    }
  }

  generateHtmlFromTemplate(template, data) {
    // Templates basiques
    const templates = {
      welcome: `
        <h1>Bienvenue sur ECOLOJIA!</h1>
        <p>Bonjour ${data.name || 'Utilisateur'},</p>
        <p>Merci de rejoindre ECOLOJIA. Commencez   scanner vos produits des maintenant!</p>
      `,
      
      premium_welcome: `
        <h1>Bienvenue Premium!</h1>
        <p>Felicitations ${data.name || 'Utilisateur'}!</p>
        <p>Votre compte Premium est maintenant actif. Profitez de toutes les fonctionnalites:</p>
        <ul>
          <li>Analyses illimitees</li>
          <li>Export de donnees</li>
          <li>Chat IA nutritionniste</li>
          <li>Support prioritaire</li>
        </ul>
      `,
      
      subscription_cancelled: `
        <h1>Abonnement annule</h1>
        <p>Votre abonnement Premium a ete annule.</p>
        <p>Vous conservez l'acces jusqu'au ${data.endDate || 'fin de la periode'}.</p>
      `,
      
      payment_failed: `
        <h1>‰chec du paiement</h1>
        <p>Le paiement de votre abonnement a echoue.</p>
        <p>Veuillez mettre   jour vos informations de paiement.</p>
      `
    };

    return templates[template] || `<p>${JSON.stringify(data)}</p>`;
  }

  // Methodes specifiques pour differents types d'emails
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Bienvenue sur ECOLOJIA!',
      template: 'welcome',
      data: { name: user.name }
    });
  }

  async sendPremiumWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Votre compte Premium est active!',
      template: 'premium_welcome',
      data: { name: user.name }
    });
  }

  async sendSubscriptionCancelledEmail(user, endDate) {
    return this.sendEmail({
      to: user.email,
      subject: 'Confirmation d\'annulation',
      template: 'subscription_cancelled',
      data: { name: user.name, endDate }
    });
  }

  async sendPaymentFailedEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: '‰chec du paiement - Action requise',
      template: 'payment_failed',
      data: { name: user.name }
    });
  }
}

// Export singleton
module.exports = new EmailService();
