# 🚀 ECOLOJIA V3 - ROADMAP MASTER COMPLÈTE
**Dernière MAJ:** 07 octobre 2025 18:05
**Statut global:** 88% → 100%
**Temps restant estimé:** 20 heures (2-3 jours intensifs)

---

## 📊 PROGRESSION GLOBALE

\\\
███████████████████████████████░░░░░░░░░ 88%

Backend:     ████████████████████████████████████████ 95%
Frontend:    ████████████████████████████████████░░░░ 90%
PWA:         ████████████████████████░░░░░░░░░░░░░░░░ 70%
Tests:       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0%
CI/CD:       ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 30%
Apps Native: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0%
\\\

---

## 🎯 MODULES RESTANTS (12% = 6 modules)

| # | Module | Priorité | Durée | Difficulté | Status |
|---|--------|----------|-------|------------|--------|
| **M6** | Tests E2E Playwright | 🔴 CRITIQUE | 3h | ⭐⭐ Facile | ❌ TODO |
| **M7** | CI/CD GitHub Actions | 🔴 CRITIQUE | 2h | ⭐⭐ Facile | ❌ TODO |
| **M9** | PWA Cache Avancé | 🟡 IMPORTANT | 2h | ⭐⭐ Facile | ❌ TODO |
| **M9b** | Screenshots PWA | 🟢 NICE-TO-HAVE | 30min | ⭐ Très facile | ❌ TODO |
| **M10** | Apps Natives (Capacitor) | 🟡 OPTIONNEL | 8h | ⭐⭐⭐ Moyen | ❌ TODO |
| **M11** | Desktop App (Electron) | 🟢 OPTIONNEL | 4h | ⭐⭐⭐ Moyen | ❌ TODO |

**TOTAL MINIMUM (Production-ready) :** 7.5h  
**TOTAL COMPLET (Avec apps natives) :** 19.5h

---

## 📋 MODULE 6 - TESTS E2E PLAYWRIGHT (3h)

### Objectif
Tester automatiquement les parcours utilisateur critiques pour garantir zéro régression.

### Pré-requis
- ✅ Node.js installé
- ✅ Frontend déployé sur Netlify
- ✅ Backend déployé sur Render

### Étapes (Commandes PowerShell complètes)

#### ÉTAPE 6.1 : Installation Playwright (15min)

\\\powershell
Set-Location "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN\frontend"

# Installation Playwright
npm install -D @playwright/test
npx playwright install chromium

# Créer dossier tests
New-Item -ItemType Directory -Path "tests" -Force
New-Item -ItemType Directory -Path "tests\e2e" -Force

Write-Host "✅ Playwright installé" -ForegroundColor Green
\\\

**Validation :** Réponds ✅ "Playwright installé"

---

#### ÉTAPE 6.2 : Configuration Playwright (10min)

\\\powershell
# Créer playwright.config.ts
@'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://frontendvf.netlify.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
'@ | Out-File "playwright.config.ts" -Encoding UTF8

Write-Host "✅ Config créée" -ForegroundColor Green
\\\

**Validation :** Réponds ✅ "Config créée"

---

#### ÉTAPE 6.3 : Test 1 - Homepage (20min)

\\\powershell
# Créer test homepage
@'
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('doit charger la page d accueil', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ECOLOJIA/);
    await expect(page.locator('text=Scannez vos produits')).toBeVisible();
  });

  test('doit afficher le bouton Scanner', async ({ page }) => {
    await page.goto('/');
    const scanBtn = page.locator('text=Scanner');
    await expect(scanBtn).toBeVisible();
  });

  test('doit naviguer vers la recherche', async ({ page }) => {
    await page.goto('/');
    await page.click('text=rechercher');
    await expect(page).toHaveURL(/.*search/);
  });
});
'@ | Out-File "tests\e2e\homepage.spec.ts" -Encoding UTF8

Write-Host "✅ Test homepage créé" -ForegroundColor Green
\\\

**Validation :** Réponds ✅ "Test homepage créé"

---

#### ÉTAPE 6.4 : Test 2 - Recherche Produit (30min)

\\\powershell
@'
import { test, expect } from '@playwright/test';

test.describe('Recherche produit', () => {
  test('doit rechercher Nutella', async ({ page }) => {
    await page.goto('/search');
    
    // Remplir recherche
    await page.fill('input[type="search"]', 'Nutella');
    await page.waitForTimeout(1000);
    
    // Vérifier résultats
    const results = page.locator('[data-testid="product-card"]');
    await expect(results.first()).toBeVisible();
  });

  test('doit afficher les scores produit', async ({ page }) => {
    await page.goto('/search');
    await page.fill('input[type="search"]', 'Nutella');
    await page.waitForTimeout(1000);
    
    // Cliquer premier résultat
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Vérifier page produit
    await expect(page.locator('text=Nutri-Score')).toBeVisible();
    await expect(page.locator('text=NOVA')).toBeVisible();
  });
});
'@ | Out-File "tests\e2e\search.spec.ts" -Encoding UTF8

Write-Host "✅ Test recherche créé" -ForegroundColor Green
\\\

**Validation :** Réponds ✅ "Test recherche créé"

---

#### ÉTAPE 6.5 : Test 3 - Chat IA (30min)

\\\powershell
@'
import { test, expect } from '@playwright/test';

test.describe('Chat IA', () => {
  test.skip('doit ouvrir le chat', async ({ page }) => {
    // Skip car nécessite authentification
    await page.goto('/');
    // TODO: Ajouter login avant ce test
  });
});
'@ | Out-File "tests\e2e\chat.spec.ts" -Encoding UTF8

Write-Host "✅ Test chat créé (skipped pour auth)" -ForegroundColor Green
\\\

**Validation :** Réponds ✅ "Test chat créé"

---

#### ÉTAPE 6.6 : Exécuter TOUS les tests (20min)

\\\powershell
# Lancer tests
npx playwright test

# Voir rapport
npx playwright show-report

Write-Host "
✅ Tests exécutés" -ForegroundColor Green
Write-Host "📊 Ouvre playwright-report/index.html pour voir résultats" -ForegroundColor Cyan
\\\

**Validation :** Réponds ✅ "X tests passed" (nombre de tests réussis)

---

#### ÉTAPE 6.7 : Ajouter script package.json (5min)

\\\powershell
# Lire package.json
\ = Get-Content "package.json" | ConvertFrom-Json

# Ajouter script test:e2e
\.scripts | Add-Member -NotePropertyName "test:e2e" -NotePropertyValue "playwright test" -Force
\.scripts | Add-Member -NotePropertyName "test:e2e:ui" -NotePropertyValue "playwright test --ui" -Force

# Sauvegarder
\ | ConvertTo-Json -Depth 10 | Set-Content "package.json"

Write-Host "✅ Scripts ajoutés: npm run test:e2e" -ForegroundColor Green
\\\

**Validation :** Réponds ✅ "Scripts ajoutés"

---

#### ÉTAPE 6.8 : Commit Module 6 (5min)

\\\powershell
Set-Location "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN"

git add frontend/tests frontend/playwright.config.ts frontend/package.json
git commit -m "✅ M6 - Tests E2E Playwright: 3 suites (Homepage, Recherche, Chat)"
git push origin main

Write-Host "
🎉 MODULE 6 TERMINÉ (3h)" -ForegroundColor Green
Write-Host "📊 Progression: 88% → 91%" -ForegroundColor Cyan
\\\

**Validation :** Réponds ✅ "M6 pushed - Passer M7"

---

## 📋 MODULE 7 - CI/CD GITHUB ACTIONS (2h)

### Objectif
Automatiser tests + déploiements à chaque push Git.

### Pré-requis
- ✅ MODULE 6 terminé (tests existent)
- ✅ Compte GitHub avec repo

### Étapes

#### ÉTAPE 7.1 : Créer workflow GitHub (30min)

\\\powershell
Set-Location "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN"

# Créer dossier .github/workflows
New-Item -ItemType Directory -Path ".github\workflows" -Force

# Créer workflow CI
@'
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run E2E tests
        working-directory: ./frontend
        run: npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Check syntax
        working-directory: ./backend
        run: node -c src/main.js

  deploy-notification:
    needs: [test-frontend, test-backend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deployment success
        run: echo "✅ Tests passed - Netlify/Render will auto-deploy"
'@ | Out-File ".github\workflows\ci.yml" -Encoding UTF8

Write-Host "✅ Workflow CI créé" -ForegroundColor Green
\\\

**Validation :** Réponds ✅ "Workflow créé"

---

#### ÉTAPE 7.2 : Commit + Push (10min)

\\\powershell
git add .github/workflows/ci.yml
git commit -m "🚀 M7 - CI/CD: Tests auto à chaque push"
git push origin main

Write-Host "
⏳ Attends 2 min que GitHub Actions s'exécute..." -ForegroundColor Yellow
Start-Sleep -Seconds 120

Write-Host "📊 Vérifie: https://github.com/ecojiaflow/ecolojia-v3/actions" -ForegroundColor Cyan
\\\

**Validation :** Réponds ✅ "CI passé" ou ❌ "CI échoué (erreur)"

---

#### ÉTAPE 7.3 : Badge README (20min)

\\\powershell
# Créer README.md avec badge CI
@"
# 🌿 ECOLOJIA V3

![CI/CD](https://github.com/ecojiaflow/ecolojia-v3/actions/workflows/ci.yml/badge.svg)
![Version](https://img.shields.io/badge/version-3.1.0-green)
![PWA](https://img.shields.io/badge/PWA-ready-blue)

## 🚀 App Production

- **Frontend:** https://frontendvf.netlify.app
- **Backend API:** https://ecolojia-backendvf.onrender.com
- **Monitoring:** UptimeRobot 100% uptime

## 📊 Stack Technique

- **Frontend:** React + TypeScript + Vite + PWA
- **Backend:** Node.js + Express + MongoDB
- **IA:** DeepSeek Chat + Google Vision OCR
- **Déploiement:** Netlify + Render
- **Tests:** Playwright E2E
- **CI/CD:** GitHub Actions

## 🎯 Fonctionnalités

- ✅ Scan code-barre + OCR ingrédients
- ✅ Analyse Nutri-Score, NOVA, Éco-Score
- ✅ Alternatives bio/saines
- ✅ Chat IA nutritionniste
- ✅ Dashboard utilisateur
- ✅ PWA installable (offline partiel)
- ✅ Tracking RGPD compliant

## 📈 Progression

\\\\\\\\\
Backend:     95% ████████████████████████████████████████
Frontend:    90% ████████████████████████████████████░░░░
PWA:         80% ████████████████████████████████░░░░░░░░
Tests E2E:  100% ████████████████████████████████████████
CI/CD:      100% ████████████████████████████████████████
\\\\\\\\\

**Statut global:** 93% complété

## 🔧 Développement Local

\\\\\\\\\powershell
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# Tests E2E
cd frontend
npm run test:e2e
\\\\\\\\\

## 📚 Documentation

- [HANDOVER.md](docs/HANDOVER.md) - Documentation complète
- [ROADMAP.md](docs/ROADMAP.md) - Feuille de route
- [QUICKSTART.md](docs/QUICKSTART.md) - Démarrage rapide

---

**Développé avec ❤️ par un solo dev + Claude AI**
