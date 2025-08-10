Write-Host "`n=== Correction globale de l'encodage UTF-8 ===" -ForegroundColor Cyan

# Liste de tous les fichiers à corriger
$files = Get-ChildItem -Path ".\src" -Include "*.tsx", "*.ts", "*.jsx", "*.js" -Recurse

$totalFixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Dictionnaire de toutes les corrections
    $corrections = @{
        # Caractères accentués
        "Ã©" = "é"
        "Ã¨" = "è"
        "Ã " = "à"
        "Ã¢" = "â"
        "Ãª" = "ê"
        "Ã´" = "ô"
        "Ã®" = "î"
        "Ã§" = "ç"
        "Ã¹" = "ù"
        "Ã»" = "û"
        "Ã¼" = "ü"
        "Ã¶" = "ö"
        "Ã¤" = "ä"
        
        # Majuscules accentuées
        "Ã‰" = "É"
        "Ãˆ" = "È"
        "Ã€" = "À"
        "Ã‚" = "Â"
        "ÃŠ" = "Ê"
        "Ã"" = "Ô"
        "ÃŽ" = "Î"
        "Ã‡" = "Ç"
        "Ã™" = "Ù"
        
        # Caractères spéciaux
        "Å"" = "œ"
        "Å'" = "Œ"
        "Ã±" = "ñ"
        "Ã'" = "Ñ"
        
        # Apostrophes et guillemets
        "â€™" = "'"
        "â€˜" = "'"
        "â€œ" = '"'
        "â€" = '"'
        "â€"" = "–"
        "â€"" = "—"
        "â€¢" = "•"
        "â€¦" = "…"
        
        # Symboles
        "â‚¬" = "€"
        "Â°" = "°"
        "Â©" = "©"
        "Â®" = "®"
        "â„¢" = "™"
        
        # Corrections spécifiques ECOLOJIA
        "ÃƒÂ©" = "é"
        "ÃƒÂ¨" = "è"
        "ÃƒÂ " = "à"
        "ÃƒÂ¢" = "â"
        "ÃƒÂª" = "ê"
        "ÃƒÂ´" = "ô"
        "ÃƒÂ®" = "î"
        "ÃƒÂ§" = "ç"
        "Ã‚Â©" = "©"
        "Ãƒâ€¦" = "à"
        "ÃƒÆ'" = "à"
        "Ã¢â‚¬Å¡" = ""
        "Ã¢â‚¬Å"" = '"'
        "Ã¢â‚¬" = '"'
        "Ã¢â€šÂ¬" = "€"
        "Ã‚Â°" = "°"
        
        # Emojis mal encodés
        "Ã°Å¸Å'Â±" = "🌱"
        "Ã°Å¸Â¤â€" = "🤔"
        "ðŸŒ±" = "🌱"
    }
    
    # Appliquer toutes les corrections
    foreach ($wrong in $corrections.Keys) {
        if ($content -match [regex]::Escape($wrong)) {
            $content = $content -replace [regex]::Escape($wrong), $corrections[$wrong]
        }
    }
    
    # Si le contenu a changé, sauvegarder
    if ($content -ne $originalContent) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "✓ Corrigé : $($file.Name)" -ForegroundColor Green
        $totalFixed++
    }
}

Write-Host "`n✅ Correction terminée ! $totalFixed fichiers corrigés." -ForegroundColor Green
Write-Host "Rafraîchissez votre navigateur (F5) pour voir les changements." -ForegroundColor Cyan
