// ============================================================================
// ECOLOJIA — EXPLORE ROUTES (Premium)
// VERSION 1.0.0 — 2026-01-03
// 
// ⛔ VERROUILLAGE VISION ECOLOJIA :
// - PAS de route /chat
// - PAS de route /ask
// - PAS de route /history
// - Ce module est un FLOW GUIDÉ, pas un assistant conversationnel
// ============================================================================

const express = require('express');
const router = express.Router();
const {
  exploreSituation,
  getIntentions,
  getFrequencies,
  getCategories
} = require('../services/explore.service');

// ============================================================================
// GET /api/explore/options — Récupérer les options du flow
// ============================================================================
router.get('/options', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        intentions: getIntentions(),
        frequencies: getFrequencies(),
        categories: getCategories()
      }
    });
  } catch (error) {
    console.error('[Explore] Erreur options:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ============================================================================
// POST /api/explore — Explorer une situation
// ============================================================================
router.post('/', (req, res) => {
  try {
    const { intention, frequency, category } = req.body;

    // Validation basique
    if (!intention || !frequency || !category) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres manquants: intention, frequency, category requis'
      });
    }

    // Explorer
    const result = exploreSituation({ intention, frequency, category });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[Explore] Erreur exploration:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ============================================================================
// ⛔ ROUTES INTERDITES (VERROUILLAGE EXPLICITE)
// ============================================================================
router.all('/chat', (req, res) => {
  res.status(403).json({
    success: false,
    error: 'Route interdite. Ecolojia utilise un flow guidé, pas un chat.'
  });
});

router.all('/ask', (req, res) => {
  res.status(403).json({
    success: false,
    error: 'Route interdite. Ecolojia utilise un flow guidé, pas de questions libres.'
  });
});

router.all('/history', (req, res) => {
  res.status(403).json({
    success: false,
    error: 'Route interdite. Ecolojia ne stocke pas d\'historique de conversations.'
  });
});

module.exports = router;
