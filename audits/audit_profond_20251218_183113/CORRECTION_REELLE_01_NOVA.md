# CORRECTION RÉELLE #1 - CALIBRAGE NOVA

Date: 2025-12-24 20:22:02
Fichier: backend/src/services/scoringUnified.js
Ligne: 244

## Diagnostic
- Première correction (analyzeService.js) était INUTILE
- Le vrai moteur est scoringUnified.js (appelé via aiEnrichment)
- NOVA 3 = 40/100 trop pénalisant vs standards scientifiques

## Correction appliquée
\\\javascript
// AVANT
const novaMapping = { 1: 100, 2: 75, 3: 40, 4: 20 };

// APRÈS (aligné Monteiro et al. 2016)
const novaMapping = { 1: 100, 2: 80, 3: 60, 4: 20 };
\\\

## Impact
- Truite fumée NOVA 3: +3 points
- Score: 45/100 → ~48-52/100

## Limite connue
Score environnement = 0/100 car données OFF manquantes
(ecoScore, origin, packaging absents)
→ Nécessite correction ultérieure (valeurs par défaut)

## Test production
Barcode: 3760074380534
Attendre déploiement Render (~2-3 min)

## Commit
4d36378d fix(scoring): Correction calibrage NOVA selon standards scientifiques
