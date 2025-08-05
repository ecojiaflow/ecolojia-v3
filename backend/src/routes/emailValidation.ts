import { Request, Response } from 'express';
// PATH: backend/src/routes/emailValidation.ts
import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { emailValidationService } from '../auth/services/EmailValidationService'; // ✅ Import corrigé

const router = express.Router();

// === MIDDLEWARE DE VALIDATION ===

const verifyTokenValidation = [
  body('token')
    .isLength({ min: 32, max: 128 })
    .withMessage('Token de validation invalide')
];

const resendEmailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide')
];

const statusEmailValidation = [
  param('email')
    .isEmail()
    .withMessage('Email invalide')
];

// === ROUTES EMAIL VALIDATION ===

/**
 * POST /api/email-validation/verify
 * Vérification token email
 */
router.post('/verify', verifyTokenValidation, async (req: Request, res: Response) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide',
        errors: errors.array()
      });
    }

    const { token } = req.body;

    console.log('🔍 Vérification token email:', token.substring(0, 8) + '...');

    // Appel service de vérification
    const result = await emailValidationService.verifyToken(token);

    const statusCode = result.success ? 200 : 400;
    
    console.log(result.success ? '✅' : '❌', 'Vérification token:', result.message);

    res.status(statusCode).json(result);

  } catch (error: any) {
    console.error('❌ Email verification error:', error); return res.status(500).json({ error: "Erreur serveur" });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification'
    });
  }
});

/**
 * POST /api/email-validation/resend
 * Renvoyer email de validation
 */
router.post('/resend', resendEmailValidation, async (req: Request, res: Response) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    console.log('📧 Renvoi email validation demandé pour:', email);

    // Appel service de renvoi
    const result = await emailValidationService.resendVerificationEmail(email);

    const statusCode = result.success ? 200 : 400;
    
    console.log(result.success ? '✅' : '❌', 'Renvoi email:', result.message);

    res.status(statusCode).json(result);

  } catch (error: any) {
    console.error('❌ Email resend error:', error); return res.status(500).json({ error: "Erreur serveur" });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du renvoi'
    });
  }
});

/**
 * GET /api/email-validation/status/:email
 * Récupérer statut validation email
 */
router.get('/status/:email', statusEmailValidation, async (req: Request, res: Response) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide',
        errors: errors.array()
      });
    }

    const { email } = req.params;

    console.log('📊 Vérification statut email:', email);

    // Appel service de statut
    const result = await emailValidationService.getValidationStatus(email);

    const statusCode = result.success ? 200 : 404;
    
    res.status(statusCode).json(result);

  } catch (error: any) {
    console.error('❌ Email status error:', error); return res.status(500).json({ error: "Erreur serveur" });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du statut'
    });
  }
});

export default router;


