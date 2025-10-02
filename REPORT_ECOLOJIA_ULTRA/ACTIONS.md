# ACTIONS — Priorités (auto)

## 1) Export/Import (éviter régressions)
- Ouvre **MAP_exports.csv** et corrige les fichiers utilisés par **App.tsx** qui ont un mauvais type d'export.
**Mismatches détectés :**
- Import nommé manquant: Layout depuis ./components/layout/Layout (fichier: .\src\.\components\layout\Layout.tsx)
- Import nommé manquant: ProtectedRoute depuis ./components/ProtectedRoute (fichier: .\src\.\components\ProtectedRoute.tsx)
- Import nommé manquant: HomePage depuis ./pages/HomePage (fichier: .\src\.\pages\HomePage.tsx)
- Import nommé manquant: SearchPage depuis ./pages/SearchPage (fichier: .\src\.\pages\SearchPage.tsx)
- Import nommé manquant: ResultsPageIntegrated as ResultsPage depuis ./pages/ResultsPageIntegrated (fichier: .\src\.\pages\ResultsPageIntegrated.tsx)
- Import nommé manquant: DashboardPage depuis ./pages/DashboardPage (fichier: .\src\.\pages\DashboardPage.tsx)
- Import nommé manquant: ScanPageIntegrated as BarcodeScanPage depuis ./pages/ScanPageIntegrated (fichier: .\src\.\pages\ScanPageIntegrated.tsx)
- Import nommé manquant: LoginPage depuis ./pages/LoginPage (fichier: .\src\.\pages\LoginPage.tsx)
- Import nommé manquant: RegisterPage depuis ./pages/RegisterPage (fichier: .\src\.\pages\RegisterPage.tsx)
- Import nommé manquant: HistoryPage depuis ./pages/HistoryPage (fichier: .\src\.\pages\HistoryPage.tsx)
- Import nommé manquant: OnboardingPage depuis ./pages/OnboardingPage (fichier: .\src\.\pages\OnboardingPage.tsx)
- Import nommé manquant: DiagnosticPage depuis ./pages/DiagnosticPage (fichier: .\src\.\pages\DiagnosticPage.tsx)
- Import nommé manquant: MultiScanPage depuis ./pages/MultiScanPage (fichier: .\src\.\pages\MultiScanPage.tsx)

## 2) API backend (endpoints essentiels)
- **Manquants dans le code** : /api/analysis, /api/search, /api/vision/analyze-image
- **Production** : [OK] https://ecolojia-backendvf.onrender.com/api/health ; [FAIL] https://ecolojia-backendvf.onrender.com/api/version -> Le serveur distant a retourné une erreur : (404) Introuvable.

## 3) .env backend
- **Clés manquantes** : MOCK_OFF, MOCK_VISION, MOCK_ALGOLIA

## 4) Prochaines micro-étapes
- Corriger UNIQUEMENT les points listés ci-dessus.
- Relancer le front/back local → vérifier le scan + fiche produit.
- Si toujours bloqué : m’envoyer **ACTIONS.md** et un screenshot de l’erreur.
