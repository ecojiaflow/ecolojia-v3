# ECOLOJIA V3 - Application d analyse de produits

## Description
Application web progressive pour analyser produits alimentaires, cosmetiques et detergents via scan code-barres ou OCR photo.

## Fonctionnalites
- Scanner code-barres (natif + Quagga2 fallback)
- Analyse multi-categories (food/cosmetics/detergents)
- Scoring sante/environnement/global
- Chat IA nutritionniste (DeepSeek)
- Recherche instantanee (Algolia)
- OCR etiquettes (Google Vision)
- Abonnements Premium (LemonSqueezy)
- PWA installable

## Tech Stack
Backend: Node.js, Express, MongoDB, TypeScript
Frontend: React, TypeScript, Vite, TailwindCSS
APIs: OpenFoodFacts, Google Vision, Algolia, DeepSeek
Deploiement: Render (backend), Netlify (frontend)

## Installation locale

Backend:
cd backend
npm install
cp .env.example .env
npm run dev

Frontend:
cd frontend
npm install
cp .env.example .env.development
npm run dev

## URLs Production
Frontend: https://frontendvf.netlify.app
Backend: https://ecolojia-backendvf.onrender.com

## Scores
Sante (0-100): Nutri-Score (30%) + NOVA (70%)
Environnement (0-100): Eco-Score
Global (0-100): Sante (70%) + Environnement (30%)

## Tests
Scanner ces codes-barres:
- 3017620422003 (Nutella) - Score attendu ~33%
- 3560070734917 (Eau minerale) - Score attendu ~95%

## Statut
Avancement: 90%
Statut: Beta publique
