# SCRIPT 1 - PREPARATION ECOLOJIA
Write-Host "ECOLOJIA - PREPARATION" -ForegroundColor Cyan

# Nettoyer
Write-Host "Nettoyage..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Include "*.backup_*", "_archive", "*postgres*", "*prisma*" -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Creer dossiers
Write-Host "Creation dossiers..." -ForegroundColor Yellow
@(
    ".\frontend\src\services",
    ".\frontend\src\components\scanner",
    ".\backend\src\services",
    ".\backend\src\routes"
) | ForEach-Object {
    New-Item -ItemType Directory -Path $_ -Force | Out-Null
}

# Creer .env frontend
if (-not (Test-Path ".\frontend\.env")) {
    @"
VITE_APP_NAME=ECOLOJIA
VITE_API_URL=https://ecolojia-backendvf.onrender.com/api
VITE_REQUEST_TIMEOUT_MS=20000
"@ | Out-File -FilePath ".\frontend\.env" -Encoding UTF8
    Write-Host "Cree: frontend/.env" -ForegroundColor Green
}

# Corriger encodage
Write-Host "Correction encodage..." -ForegroundColor Yellow
Get-ChildItem -Path ".\frontend\src" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.json" -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($content) {
        $content = $content -replace "Ã©", "é"
        $content = $content -replace "Ã¨", "è"
        $content = $content -replace "Ã ", "à"
        $content = $content -replace "Ã§", "ç"
        [System.IO.File]::WriteAllText($_.FullName, $content, [System.Text.Encoding]::UTF8)
    }
}

Write-Host "PREPARATION TERMINEE!" -ForegroundColor Green
Write-Host "Executez maintenant: .\integrate.ps1" -ForegroundColor Yellow