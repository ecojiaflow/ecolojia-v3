# CHANGELOG

## [3.0.0] - 2025-10-02

### Ajoute
- Scoring automatique (sante/environnement/global)
- Scanner BarcodeDetector natif + fallback Quagga2
- Enrichissement OpenFoodFacts/OpenBeautyFacts
- Support multi-categories (food/cosmetics/detergents)
- Chat IA nutritionniste DeepSeek
- Recherche instantanee Algolia
- OCR Google Vision
- Systeme paiements LemonSqueezy
- Quotas utilisateurs
- Monitoring Sentry

### Corrige
- Structure donnees MongoDB (foodData/cosmeticsData/detergentsData)
- Normalisation grades (A-E majuscule)
- Import scanner (BarcodeScanner vs BarcodeScannerEnhanced)
- Dette technique (191 fichiers .bak supprimes)

### Production
- Backend: Render.com
- Frontend: Netlify
- Database: MongoDB Atlas
