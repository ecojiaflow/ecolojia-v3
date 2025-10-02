param(
  [switch]$UseRenderBackend # mets -UseRenderBackend pour pointer le front vers Render
)

# ---------- 0) Helper ----------
function Kill-Port([int]$port){
  $pid = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)
  if($pid){ Stop-Process -Id $pid -Force; Write-Host "✔ Port $port libéré (PID $pid)" }
  else{ Write-Host "ℹ Port $port déjà libre" }
}

# ---------- 1) Backend : .env PRODUCTION propre ----------
Set-Location "$using:backend"
Write-Host "==> Nettoyage .env parasites"
Get-ChildItem -Filter ".env*" | Where-Object { $_.Name -ne ".env" } | Remove-Item -Force -ErrorAction SilentlyContinue

$envContent = @"
ADMIN_API_KEY=ecolojia-admin-secret-key-2025
ALGOLIA_APP_ID=A2KJGZ2811
ALGOLIA_ADMIN_API_KEY=8a6393c1ff95165413e7f0bfea804357
ALGOLIA_INDEX_NAME=products
CORS_ORIGINS=https://ecolojia.com,https://frontendvf.netlify.app,http://localhost:5173
FRONTEND_URL=https://ecolojia.com
MONGODB_URI="mongodb+srv://Ecolojia:Ecolojia122331@ecolojia.gnfz2k8.mongodb.net/ecolojia-prod?retryWrites=true&w=majority"
NODE_ENV=production
PORT=10000
"@
$envContent | Set-Content ".env" -Encoding UTF8
Write-Host "✔ .env backend (prod) écrit"

# ---------- 2) Ports propres ----------
Kill-Port 10000
Kill-Port 5173
Kill-Port 4173

# ---------- 3) Backend : install & start (prod) ----------
Write-Host "==> Backend: install deps"
npm install | Out-Null

Write-Host "==> Backend: démarrage prod (fenêtre dédiée)"
$env:NODE_ENV="production"
$env:PORT="10000"
Start-Process -FilePath "node" -ArgumentList "-r","dotenv/config","src/main.js" -WorkingDirectory "$using:backend"
Start-Sleep -Seconds 3

Write-Host "==> Health check"
try{
  $health = Invoke-WebRequest -Uri "http://localhost:10000/api/health" -TimeoutSec 10
  Write-Host "✔ Backend OK ($($health.StatusCode))"
}catch{
  Write-Host "❌ Backend KO. Vérifie la console backend."
  exit 1
}

# ---------- 4) Algolia : reindex ----------
Write-Host "==> Algolia: reindex"
$headers = @{ "x-admin-key" = "ecolojia-admin-secret-key-2025" }
try{
  Invoke-WebRequest -Uri "http://localhost:10000/api/admin/reindex" -Method POST -Headers $headers -TimeoutSec 60 | Out-Null
  Write-Host "✔ Reindex demandé"
}catch{
  Write-Host "⚠ Reindex a échoué (route absente ?)."
}

# ---------- 5) Frontend : .env.production + build + preview ----------
Set-Location "$using:frontend"
npm install | Out-Null

if($UseRenderBackend){
  $apiBase = "https://ecolojia-backendvf.onrender.com"
}else{
  $apiBase = "http://localhost:10000"
}

@"
VITE_API_BASE=$apiBase
VITE_ENV=production
"@ | Set-Content ".env.production" -Encoding UTF8
Write-Host "✔ .env.production (VITE_API_BASE=$apiBase)"

Write-Host "==> Frontend: build prod"
npm run build | Out-Null

Write-Host "==> Frontend: preview (ouvre http://localhost:4173)"
Start-Process -FilePath "npm" -ArgumentList "run","preview" -WorkingDirectory "$using:frontend"

Write-Host "`n=================================================="
Write-Host "PRODUCTION LOCALE OK ✅"
Write-Host "Backend: http://localhost:10000   |  Health: /api/health"
Write-Host "Frontend: http://localhost:4173"
Write-Host "Algolia reindex: POST /api/admin/reindex"
Write-Host "==================================================`n"
