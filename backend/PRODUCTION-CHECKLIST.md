# ✅ ECOLOJIA V3 - Checklist Production

**Date** : 29/09/2025 | **Version** : 3.0.0 | **Status** : PRODUCTION READY

## Infrastructure
- [x] Backend Render : https://ecolojia-backendvf.onrender.com
- [x] Frontend Netlify : https://frontendvf.netlify.app
- [x] MongoDB Atlas connecte
- [x] Algolia index synchronise (10+ produits)

## Securite
- [x] ADMIN_KEY rotatee
- [x] Route admin /api/admin/reindex supprimee
- [x] CORS strict
- [x] Rate limiting actif
- [x] Helmet active

## Monitoring
- [x] UptimeRobot : 3 monitors (Backend Health, Frontend, Search API)
- [x] Alertes email configurees
- [x] Script smoke-test-prod.ps1 valide

## Tests
- [x] GET /api/health → 200 OK
- [x] GET /api/algolia/search?q=nutella → 10 resultats
- [x] Frontend → HTTP 200

## Modules valides
- [x] M1: Foundation | M3: Database | M4: OpenFoodFacts
- [x] M5: Scoring | M6: Frontend Search | M8: Algolia
- [x] M11: Monitoring

## Modules en attente
- [ ] M2: Scanner | M7: Vision OCR | M9: PWA | M10: Payments

## Maintenance Algolia
Script local ponctuel (secrets en session PowerShell uniquement)
