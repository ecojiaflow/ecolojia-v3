# ECOLOJIA — RAPPORT LISIBLE

_Date_: 10/02/2025 18:32:50

## ✅ Vue d'ensemble
- **Versions** : voir [versions.txt](.\versions.txt)
- **Arborescences** : [backend](.\tree_backend.txt) · [frontend](.\tree_frontend.txt)
- **Packages** : [backend](.\package_backend.txt) · [frontend](.\package_frontend.txt)
- **.env** : [backend](.\env_backend.txt) · [frontend](.\env_frontend.txt)

## 🔎 Code & Routes
- **Exports** : [exports_frontend.csv](.\exports_frontend.csv) · [exports_backend.csv](.\exports_backend.csv)
- **Routes** : [routes_frontend.csv](.\routes_frontend.csv) · [routes_backend.csv](.\routes_backend.csv)

## 🧩 Modules clés (grep)
- Scanner : [grep_scanner.txt](.\grep_scanner.txt)
- OFF/OBF : [grep_off_obf.txt](.\grep_off_obf.txt)
- OCR : [grep_ocr.txt](.\grep_ocr.txt)
- Algolia : [grep_algolia.txt](.\grep_algolia.txt)
- Sentry : [grep_sentry.txt](.\grep_sentry.txt)

## 🧪 Qualité (logs courts)
- Front typecheck : [npm_frontend_typecheck.log](.\npm_frontend_typecheck.log)
- Front build : [npm_frontend_build.log](.\npm_frontend_build.log)
- Back typecheck : [npm_backend_typecheck.log](.\npm_backend_typecheck.log)
- Back tsc --noEmit : [tsc_backend_noemit.log](.\tsc_backend_noemit.log)

## 🌐 Prod
- Endpoints : [endpoints_prod.txt](.\endpoints_prod.txt)

## 📝 TODO/FIXME
- Liste : [todos.csv](.\todos.csv)

---

### 🎯 À lire en premier (actionnable)
1) Ouvre **exports_frontend.csv** → repère les fichiers avec default_export=no si **App.tsx** fait des imports nommés (ou l’inverse).  
2) Ouvre **routes_backend.csv** → confirme que **/api/analysis**, **/api/search**, **/api/vision/analyze-image** sont bien là.  
3) Check **env_backend.txt** → MONGODB_URI, CORS_ORIGINS.  
4) Si un log contient des erreurs → corriger **seulement** ce qui casse (pas de refonte).

