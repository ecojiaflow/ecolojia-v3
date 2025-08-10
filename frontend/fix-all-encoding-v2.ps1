Write-Host "`n=== Recherche des problèmes d'encodage ===" -ForegroundColor Cyan

$problemsFound = @()

# Rechercher dans tous les fichiers
$files = Get-ChildItem -Path ".\src" -Include "*.tsx", "*.ts", "*.jsx", "*.js" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Vérifier si le fichier contient des problèmes
    if ($content -match "Ã©|Ã¨|Ã |â€™|â€œ") {
        $problemsFound += $file.FullName
        Write-Host "❌ Problème trouvé dans : $($file.Name)" -ForegroundColor Red
        
        # Appliquer les corrections
        $content = $content -replace "Ã©", "é"
        $content = $content -replace "Ã¨", "è"
        $content = $content -replace "Ã ", "à"
        $content = $content -replace "Ã¢", "â"
        $content = $content -replace "Ãª", "ê"
        $content = $content -replace "Ã´", "ô"
        $content = $content -replace "Ã®", "î"
        $content = $content -replace "Ã§", "ç"
        $content = $content -replace "Ã¹", "ù"
        $content = $content -replace "Ã»", "û"
        $content = $content -replace "â€™", "'"
        $content = $content -replace "â€œ", '"'
        $content = $content -replace "â€", '"'
        
        # Corrections spécifiques pour les mots complets
        $content = $content -replace "Cosm.*?tique", "Cosmétique"
        $content = $content -replace "Hygi.*?ne", "Hygiène"
        $content = $content -replace "CAT.*?GORIES", "CATÉGORIES"
        $content = $content -replace "Z.*?ro d.*?chet", "Zéro déchet"
        $content = $content -replace "Bio.*?quitable", "Bio équitable"
        
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "✓ Corrigé : $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ Correction terminée. Fichiers corrigés : $($problemsFound.Count)" -ForegroundColor Green
