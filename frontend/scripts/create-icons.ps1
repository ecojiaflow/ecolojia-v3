# PATH: frontend/scripts/create-icons.ps1
# Script pour créer des icônes temporaires

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Split-Path -Parent $scriptPath
$publicPath = Join-Path $frontendPath "public"

# Créer le dossier public s'il n'existe pas
if (!(Test-Path $publicPath)) {
    New-Item -ItemType Directory -Path $publicPath | Out-Null
}

# Créer le dossier .well-known
$wellKnownPath = Join-Path $publicPath ".well-known"
if (!(Test-Path $wellKnownPath)) {
    New-Item -ItemType Directory -Path $wellKnownPath | Out-Null
}

# Créer des images PNG temporaires (1x1 pixel transparent)
$pngData = [Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")

# Liste des icônes à créer
$icons = @(
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "icon-192.png",
    "icon-512.png",
    "mstile-150x150.png"
)

foreach ($icon in $icons) {
    $path = Join-Path $publicPath $icon
    [System.IO.File]::WriteAllBytes($path, $pngData)
    Write-Host "✓ Créé: $icon" -ForegroundColor Green
}

# Créer og-image.jpg (image temporaire)
$jpgData = [Convert]::FromBase64String("/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=")
$ogImagePath = Join-Path $publicPath "og-image.jpg"
[System.IO.File]::WriteAllBytes($ogImagePath, $jpgData)
Write-Host "✓ Créé: og-image.jpg" -ForegroundColor Green

Write-Host "`n✅ Toutes les icônes temporaires ont été créées!" -ForegroundColor Green
Write-Host "⚠️  N'oubliez pas de les remplacer par de vraies icônes!" -ForegroundColor Yellow