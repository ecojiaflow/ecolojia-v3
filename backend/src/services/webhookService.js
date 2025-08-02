// backend/src/services/webhookService.js
const redis = require('redis');
const nodemailer = require('nodemailer');
const WebhookLog = require('../models/WebhookLog');
const PaymentLog = require('../models/PaymentLog');

class WebhookService {
  constructor() {
    this.redisClient = null;
    this.emailTransporter = null;
    this.initServices();
  }

  async initServices() {
    // Redis pour idempotence
    if (process.env.REDIS_URL) {
      try {
        this.redisClient = redis.createClient({ url: process.env.REDIS_URL });
        await this.redisClient.connect();
        console.log('[WebhookService] Redis connected');
      } catch (error) {
        console.error('[WebhookService] Redis connection failed:', error);
      }
    }

    // Email transporter
    if (process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // IDEMPOTENCE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Vérifie si un webhook a déjà été traité
   */
  async checkIdempotency(eventId) {
    // Vérifier d'abord dans Redis (cache rapide)
    if (this.redisClient?.isReady) {
      const cached = await this.redisClient.get(`webhook:${eventId}`);
      if (cached) return true;
    }

    // Vérifier dans la base de données
    const existing = await WebhookLog.findOne({ eventId });
    return !!existing;
  }

  /**
   * Marque un webhook comme traité
   */
  async markAsProcessed(eventId, eventName, result) {
    // Stocker dans Redis avec TTL de 7 jours
    if (this.redisClient?.isReady) {
      await this.redisClient.setex(`webhook:${eventId}`, 604800, 'processed');
    }

    // Stocker dans la base de données
    await WebhookLog.create({
      eventId,
      eventName,
      processedAt: new Date(),
      result,
      status: 'success'
    });
  }

  /**
   * Log une erreur de traitement
   */
  async logError(eventId, eventName, error) {
    await WebhookLog.create({
      eventId,
      eventName,
      processedAt: new Date(),
      error: {
        message: error.message,
        stack: error.stack
      },
      status: 'error'
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EMAILS TRANSACTIONNELS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Email de bienvenue Premium
   */
  async sendPremiumWelcomeEmail(user) {
    if (!this.emailTransporter) return;

    try {
      await this.emailTransporter.sendMail({
        from: '"ECOLOJIA" <premium@ecolojia.app>',
        to: user.email,
        subject: '🎉 Bienvenue dans ECOLOJIA Premium !',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
              .features { margin: 20px 0; }
              .feature { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bienvenue dans ECOLOJIA Premium ! 🌱</h1>
                <p>Félicitations ${user.profile?.firstName || 'Champion'}, vous faites maintenant partie de la communauté Premium !</p>
              </div>
              <div class="content">
                <h2>Vos avantages Premium sont actifs :</h2>
                <div class="features">
                  <div class="feature">✅ <strong>Analyses illimitées</strong> - Scannez autant de produits que vous voulez</div>
                  <div class="feature">🤖 <strong>Chat IA illimité</strong> - Posez toutes vos questions nutritionnelles</div>
                  <div class="feature">📊 <strong>Exports de données</strong> - Téléchargez vos analyses en PDF/CSV</div>
                  <div class="feature">🎯 <strong>Dashboard avancé</strong> - Suivez vos progrès en détail</div>
                  <div class="feature">🚀 <strong>Sans publicité</strong> - Une expérience fluide et agréable</div>
                  <div class="feature">💬 <strong>Support prioritaire</strong> - Réponse en 24h garantie</div>
                </div>
                
                <h3>Prochaines étapes :</h3>
                <ol>
                  <li>Configurez vos préférences alimentaires dans votre profil</li>
                  <li>Scannez votre premier produit Premium</li>
                  <li>Explorez le chat IA pour des conseils personnalisés</li>
                </ol>
                
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Accéder à mon Dashboard Premium</a>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  Plan : ${user.subscription.plan === 'annual' ? 'Annuel' : 'Mensuel'}<br>
                  Prochain renouvellement : ${new Date(user.subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}<br>
                  <br>
                  Des questions ? Répondez simplement à cet email, notre équipe Premium est là pour vous !
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log(`[WebhookService] Premium welcome email sent to ${user.email}`);
    } catch (error) {
      console.error('[WebhookService] Email error:', error);
    }
  }

  /**
   * Email de confirmation d'annulation
   */
  async sendCancellationEmail(user) {
    if (!this.emailTransporter) return;

    try {
      const endDate = new Date(user.subscription.currentPeriodEnd);
      
      await this.emailTransporter.sendMail({
        from: '"ECOLOJIA" <support@ecolojia.app>',
        to: user.email,
        subject: '😢 Confirmation de résiliation de votre abonnement',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #fef3c7; color: #92400e; padding: 30px; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
              .warning { background: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Votre abonnement a été résilié</h1>
                <p>Nous sommes tristes de vous voir partir, ${user.profile?.firstName || 'vous'} 😢</p>
              </div>
              <div class="content">
                <p>Votre demande de résiliation a bien été prise en compte.</p>
                
                <div class="warning">
                  <strong>⚠️ Important :</strong><br>
                  Vous conservez l'accès Premium jusqu'au <strong>${endDate.toLocaleDateString('fr-FR')}</strong>.<br>
                  Après cette date, votre compte repassera en version gratuite avec des fonctionnalités limitées.
                </div>
                
                <h3>Ce que vous allez perdre :</h3>
                <ul>
                  <li>❌ Analyses illimitées (limité à 30/mois)</li>
                  <li>❌ Chat IA (plus disponible)</li>
                  <li>❌ Exports de données</li>
                  <li>❌ Dashboard avancé</li>
                  <li>❌ Support prioritaire</li>
                </ul>
                
                <h3>Changé d'avis ?</h3>
                <p>Vous pouvez réactiver votre abonnement à tout moment avant le ${endDate.toLocaleDateString('fr-FR')} :</p>
                
                <a href="${process.env.FRONTEND_URL}/subscription" class="button">Réactiver mon abonnement</a>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  Nous aimerions comprendre pourquoi vous partez. Pourriez-vous prendre 30 secondes pour répondre à ce court sondage ?<br>
                  <a href="${process.env.FRONTEND_URL}/feedback/cancellation">Donner mon avis</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log(`[WebhookService] Cancellation email sent to ${user.email}`);
    } catch (error) {
      console.error('[WebhookService] Email error:', error);
    }
  }

  /**
   * Email d'alerte paiement échoué
   */
  async sendPaymentFailedEmail(user) {
    if (!this.emailTransporter) return;

    try {
      await this.emailTransporter.sendMail({
        from: '"ECOLOJIA" <billing@ecolojia.app>',
        to: user.email,
        subject: '⚠️ Échec de paiement - Action requise',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #fee2e2; color: #991b1b; padding: 30px; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
              .alert { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Échec de paiement</h1>
                <p>Nous n'avons pas pu traiter votre paiement</p>
              </div>
              <div class="content">
                <p>Bonjour ${user.profile?.firstName || 'vous'},</p>
                
                <p>Le renouvellement de votre abonnement ECOLOJIA Premium a échoué.</p>
                
                <div class="alert">
                  <strong>⏰ Vous avez 7 jours pour mettre à jour vos informations de paiement</strong><br>
                  Passé ce délai, votre compte sera automatiquement rétrogradé en version gratuite.
                </div>
                
                <h3>Raisons possibles :</h3>
                <ul>
                  <li>Carte expirée</li>
                  <li>Fonds insuffisants</li>
                  <li>Limite de carte atteinte</li>
                  <li>Carte bloquée par votre banque</li>
                </ul>
                
                <a href="${user.subscription?.updatePaymentUrl || process.env.FRONTEND_URL + '/subscription'}" class="button">
                  Mettre à jour mes informations de paiement
                </a>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  Besoin d'aide ? Contactez-nous à support@ecolojia.app<br>
                  Nous sommes là pour vous aider !
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log(`[WebhookService] Payment failed email sent to ${user.email}`);
    } catch (error) {
      console.error('[WebhookService] Email error:', error);
    }
  }

  /**
   * Email de downgrade vers Free
   */
  async sendDowngradeEmail(user) {
    if (!this.emailTransporter) return;

    try {
      await this.emailTransporter.sendMail({
        from: '"ECOLOJIA" <support@ecolojia.app>',
        to: user.email,
        subject: 'Votre compte est passé en version gratuite',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #e5e7eb; color: #374151; padding: 30px; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
              .limits { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Votre compte est maintenant gratuit</h1>
                <p>Votre abonnement Premium a expiré</p>
              </div>
              <div class="content">
                <p>Bonjour ${user.profile?.firstName || 'vous'},</p>
                
                <p>Votre abonnement ECOLOJIA Premium a expiré et votre compte est maintenant en version gratuite.</p>
                
                <div class="limits">
                  <strong>Vos nouvelles limites :</strong><br>
                  • 30 analyses par mois<br>
                  • Pas d'accès au chat IA<br>
                  • Pas d'export de données<br>
                  • Dashboard basique<br>
                  • Publicités activées
                </div>
                
                <h3>Vous manquez déjà les avantages Premium ?</h3>
                <p>Réabonnez-vous maintenant et bénéficiez de <strong>-20% sur le premier mois</strong> avec le code <strong>COMEBACK20</strong> !</p>
                
                <a href="${process.env.FRONTEND_URL}/premium?promo=COMEBACK20" class="button">
                  Reprendre Premium avec -20%
                </a>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  Merci d'avoir été membre Premium. Nous espérons vous revoir bientôt !<br>
                  L'équipe ECOLOJIA
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log(`[WebhookService] Downgrade email sent to ${user.email}`);
    } catch (error) {
      console.error('[WebhookService] Email error:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LOGGING DES PAIEMENTS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Log un paiement
   */
  async logPayment(userId, paymentData) {
    try {
      await PaymentLog.create({
        userId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status,
        invoiceUrl: paymentData.invoiceUrl,
        error: paymentData.error,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[WebhookService] Error logging payment:', error);
    }
  }

  /**
   * Log un remboursement
   */
  async logRefund(userId, refundData) {
    try {
      await PaymentLog.create({
        userId,
        amount: -refundData.amount, // Négatif pour un remboursement
        currency: 'EUR',
        status: 'refunded',
        orderId: refundData.orderId,
        reason: refundData.reason,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[WebhookService] Error logging refund:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAINTENANCE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Nettoyer les vieux logs (à exécuter via cron)
   */
  async cleanupOldLogs() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await WebhookLog.deleteMany({
      processedAt: { $lt: thirtyDaysAgo },
      status: 'success'
    });

    console.log(`[WebhookService] Cleaned up ${result.deletedCount} old webhook logs`);
  }

  /**
   * Retry les webhooks échoués
   */
  async retryFailedWebhooks() {
    const failedWebhooks = await WebhookLog.find({
      status: 'error',
      retryCount: { $lt: 3 },
      processedAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Dernières 24h
    });

    for (const webhook of failedWebhooks) {
      // TODO: Implémenter la logique de retry
      console.log(`[WebhookService] Should retry webhook ${webhook.eventId}`);
    }
  }
}

module.exports = new WebhookService();