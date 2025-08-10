Write-Host "`n=== Mise à jour de l'interface ECOLOJIA ===" -ForegroundColor Cyan

# 1. Modifier App.tsx pour utiliser le Navbar avancé
$appContent = Get-Content ".\src\App.tsx" -Raw

# Importer le Navbar
if ($appContent -notmatch "import Navbar") {
    # Ajouter l'import après les autres imports de composants
    $appContent = $appContent -replace "(import.*AuthPage.*)`n", "`$1`nimport Navbar from './components/Navbar';`n"
}

# Remplacer la navigation basique par le Navbar
$appContent = $appContent -replace '<nav className="bg-white shadow-sm">[\s\S]*?</nav>', '<Navbar />'

# Sauvegarder
[System.IO.File]::WriteAllText(".\src\App.tsx", $appContent, [System.Text.Encoding]::UTF8)
Write-Host "✓ Navbar avancé intégré" -ForegroundColor Green

# 2. Améliorer SearchPage avec le style premium
Write-Host "`nAmélioration de la page de recherche..." -ForegroundColor Yellow

