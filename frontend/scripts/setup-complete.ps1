# PATH: frontend/scripts/setup-complete.ps1
# Script de configuration complète ECOLOJIA Frontend
param(
    [switch]$SkipDependencies = $false
)

Write-Host "🚀 Configuration complète ECOLOJIA Frontend" -ForegroundColor Green

# Se placer dans le dossier frontend
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Split-Path -Parent $scriptPath
Set-Location $frontendPath

# 1. Créer la structure de dossiers
Write-Host "`n📁 Création de la structure de dossiers..." -ForegroundColor Yellow

$folders = @(
    "src/components/scanner",
    "src/components/analysis", 
    "src/components/chat",
    "src/pages",
    "src/services",
    "src/hooks",
    "src/config",
    "src/types",
    "src/test",
    "public/.well-known",
    "e2e",
    "scripts"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  ✓ $folder" -ForegroundColor Green
    }
}

# 2. Créer les icônes temporaires
Write-Host "`n🖼️ Création des icônes temporaires..." -ForegroundColor Yellow
$createIconsScript = Join-Path $scriptPath "create-icons.ps1"
if (Test-Path $createIconsScript) {
    & $createIconsScript
} else {
    Write-Host "  ⚠️ Script create-icons.ps1 non trouvé" -ForegroundColor Yellow
}

# 3. Installer les dépendances (si pas skip)
if (!$SkipDependencies) {
    Write-Host "`n📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
    
    # Installer Playwright
    Write-Host "`n🎭 Installation de Playwright..." -ForegroundColor Yellow
    npx playwright install --with-deps chromium
}

# 4. Vérifier les fichiers critiques
Write-Host "`n🔍 Vérification des fichiers critiques..." -ForegroundColor Yellow

$criticalFiles = @(
    "index.html",
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
    ".env",
    "src/main.tsx",
    "src/App.tsx",
    "src/index.css"
)

$missingFiles = @()
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n⚠️  Fichiers manquants détectés!" -ForegroundColor Yellow
    Write-Host "Veuillez vous assurer que tous les fichiers ont été correctement copiés." -ForegroundColor Yellow
}

# 5. Créer un fichier .gitignore si absent
if (!(Test-Path ".gitignore")) {
    Write-Host "`n📝 Création du .gitignore..." -ForegroundColor Yellow
    $gitignoreContent = @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
playwright-report/
test-results/

# Production
dist/
dist-ssr/
*.local

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Env files
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# PWA
sw.js
workbox-*.js

# Misc
*.log
.eslintcache
"@
    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Host "  ✓ .gitignore créé" -ForegroundColor Green
}

# 6. Test de build
Write-Host "`n🔨 Test de build..." -ForegroundColor Yellow
$buildResult = npm run build 2>&1
$buildSuccess = $LASTEXITCODE -eq 0

if ($buildSuccess) {
    Write-Host "  ✓ Build réussi!" -ForegroundColor Green
    
    # 7. Afficher les prochaines étapes
    Write-Host "`n✅ Configuration terminée avec succès!" -ForegroundColor Green
    Write-Host "`n📋 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "  1. Lancer le développement: npm run dev" -ForegroundColor White
    Write-Host "  2. Lancer les tests: npm run test" -ForegroundColor White
    Write-Host "  3. Lancer les tests E2E: npm run e2e" -ForegroundColor White
    Write-Host "  4. Prévisualiser la production: npm run preview" -ForegroundColor White
    Write-Host "`n⚠️  N'oubliez pas de:" -ForegroundColor Yellow
    Write-Host "  - Remplacer les icônes temporaires par de vraies icônes" -ForegroundColor White
    Write-Host "  - Configurer les variables d'environnement de production" -ForegroundColor White
    Write-Host "  - Configurer le déploiement (Netlify/Vercel)" -ForegroundColor White
} else {
    Write-Host "  ✗ Échec du build" -ForegroundColor Red
    Write-Host "Veuillez vérifier les erreurs ci-dessus" -ForegroundColor Red
    Write-Host "`nErreur détaillée:" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
}

# Retourner au dossier d'origine
Pop-Location