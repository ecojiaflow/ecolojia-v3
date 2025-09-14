# Nettoyer
Remove-Item -Path ".\frontend\src\**\*.backup_*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\backend\**\*postgres*" -Recurse -Force -ErrorAction SilentlyContinue

# Créer dossiers
mkdir ".\frontend\src\services" -Force
mkdir ".\frontend\src\components\scanner" -Force

# Créer .env
"VITE_APP_NAME=ECOLOJIA`nVITE_API_URL=https://ecolojia-backendvf.onrender.com/api" | Out-File -FilePath ".\frontend\.env" -Encoding UTF8

Write-Host "FAIT! Maintenant copiez les 4 fichiers du chat precedent" -ForegroundColor Green
