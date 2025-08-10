Write-Host "`n=== Correction d'App.tsx ===" -ForegroundColor Cyan

$content = Get-Content ".\src\App.tsx" -Raw

# Le problème vient probablement du remplacement du nav qui a cassé la structure
# Vérifier si le Navbar est bien fermé et la structure correcte

# S'assurer que le Layout est bien structuré
if ($content -match "<Navbar />[\s\S]*?</div>[\s\S]*?\);[\s\S]*?};") {
    Write-Host "Structure semble correcte" -ForegroundColor Green
} else {
    Write-Host "Correction de la structure Layout..." -ForegroundColor Yellow
    
    # Chercher où le Layout commence
    if ($content -match "(const Layout[^{]+{[^{]+{[^}]+)(<Navbar />)([\s\S]*?)(</div>[\s\S]*?</div>[\s\S]*?</div>)") {
        # Reconstruire proprement
        $before = $matches[1]
        $navbar = $matches[2]
        $after = $matches[4]
        
        $newLayout = @"
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Contenu principal */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-between items-center">
            <div className="text-gray-600 text-sm">
              © 2025 ECOLOJIA - L'assistant IA pour une consommation consciente
            </div>
            <div className="flex space-x-4 text-sm">
              <Link to="/about" className="text-gray-600 hover:text-green-600">À propos</Link>
              <Link to="/privacy" className="text-gray-600 hover:text-green-600">Confidentialité</Link>
              <Link to="/terms" className="text-gray-600 hover:text-green-600">Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
"@
        
        # Remplacer le Layout dans le contenu
        $content = $content -replace "const Layout[\s\S]*?^};", $newLayout
    }
}

# Sauvegarder
[System.IO.File]::WriteAllText(".\src\App.tsx", $content, [System.Text.Encoding]::UTF8)
Write-Host "✓ App.tsx corrigé" -ForegroundColor Green
