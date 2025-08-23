# PATH: frontend/scripts/quick-setup.ps1
Write-Host "🚀 Configuration rapide ECOLOJIA Frontend" -ForegroundColor Green

# 1. Créer les dossiers nécessaires
Write-Host "`n📁 Création des dossiers..." -ForegroundColor Yellow
@(
    "public",
    "public\.well-known",
    "src\components\scanner",
    "src\components\analysis",
    "src\components\chat",
    "src\pages",
    "src\services",
    "src\hooks",
    "src\config",
    "src\types",
    "src\test",
    "e2e"
) | ForEach-Object {
    New-Item -ItemType Directory -Path $_ -Force | Out-Null
    Write-Host "  ✓ $_" -ForegroundColor Green
}

# 2. Créer les fichiers publics essentiels
Write-Host "`n📄 Création des fichiers publics..." -ForegroundColor Yellow

# favicon.svg
$favicon = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#059669" rx="4"/>
  <text x="16" y="22" text-anchor="middle" fill="white" font-size="20" font-weight="bold">E</text>
</svg>
'@
$favicon | Out-File -FilePath "public\favicon.svg" -Encoding UTF8
Write-Host "  ✓ favicon.svg" -ForegroundColor Green

# manifest.json
$manifest = @'
{
  "name": "ECOLOJIA",
  "short_name": "ECOLOJIA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#059669",
  "description": "Assistant IA d'analyse de produits",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
'@
$manifest | Out-File -FilePath "public\manifest.json" -Encoding UTF8
Write-Host "  ✓ manifest.json" -ForegroundColor Green

# robots.txt
$robots = @'
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://ecolojia.app/sitemap.xml
'@
$robots | Out-File -FilePath "public\robots.txt" -Encoding UTF8
Write-Host "  ✓ robots.txt" -ForegroundColor Green

# Créer des icônes PNG temporaires
$pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
$pngData = [Convert]::FromBase64String($pngBase64)

@("icon-192.png", "icon-512.png", "favicon-32x32.png", "apple-touch-icon.png") | ForEach-Object {
    [System.IO.File]::WriteAllBytes("public\$_", $pngData)
    Write-Host "  ✓ $_" -ForegroundColor Green
}

# 3. Vérifier les fichiers critiques
Write-Host "`n🔍 Vérification des fichiers..." -ForegroundColor Yellow
$missing = @()

@("index.html", "package.json", "vite.config.ts", "src\main.tsx", "src\App.tsx") | ForEach-Object {
    if (Test-Path $_) {
        Write-Host "  ✓ $_" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $_" -ForegroundColor Red
        $missing += $_
    }
}

if ($missing.Count -gt 0) {
    Write-Host "`n⚠️  Fichiers manquants: $($missing -join ', ')" -ForegroundColor Yellow
    exit 1
}

# 4. Test de build
Write-Host "`n🔨 Lancement du build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build réussi!" -ForegroundColor Green
    Write-Host "`nPour lancer l'application:" -ForegroundColor Cyan
    Write-Host "  npm run preview  (production)" -ForegroundColor White
    Write-Host "  npm run dev      (développement)" -ForegroundColor White
} else {
    Write-Host "`n❌ Le build a échoué" -ForegroundColor Red
}