/**
 * education.routes.js — API Education Ecolojia
 * Version: 1.0.0
 * 
 * Endpoints:
 * GET /api/education - Liste des 3 univers (summary)
 * GET /api/education/:universeId - Detail d un univers (principes + pratiques)
 */

const express = require('express');
const router = express.Router();
const path = require('path');

// Charger les donnees education
let educationData = null;

function loadEducationData() {
  if (!educationData) {
    try {
      educationData = require('../knowledge/education.json');
      console.log('[Education API] Donnees chargees:', Object.keys(educationData.universes).length, 'univers');
    } catch (error) {
      console.error('[Education API] Erreur chargement education.json:', error.message);
      educationData = { universes: {} };
    }
  }
  return educationData;
}

/**
 * GET /api/education
 * Retourne la liste des univers (summary pour affichage liste)
 */
router.get('/', (req, res) => {
  try {
    const data = loadEducationData();
    
    const universes = Object.values(data.universes).map(u => ({
      id: u.id,
      name: u.name,
      icon: u.icon,
      color: u.color,
      tagline: u.tagline,
      principlesCount: u.principles.length,
      practicesCount: u.practices.length,
      sources: u.sources
    }));
    
    res.json({
      success: true,
      version: data.version,
      universes
    });
  } catch (error) {
    console.error('[Education API] Erreur GET /:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/education/:universeId
 * Retourne le detail complet d un univers
 */
router.get('/:universeId', (req, res) => {
  try {
    const data = loadEducationData();
    const { universeId } = req.params;
    
    const universe = data.universes[universeId];
    
    if (!universe) {
      return res.status(404).json({
        success: false,
        error: 'Univers non trouve',
        availableUniverses: Object.keys(data.universes)
      });
    }
    
    res.json({
      success: true,
      universe: {
        ...universe,
        displayConfig: data.displayConfig
      }
    });
  } catch (error) {
    console.error('[Education API] Erreur GET /:universeId:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
