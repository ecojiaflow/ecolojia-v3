# Correction des problèmes d'encodage dans les fichiers i18n
Write-Host "🔧 Correction des fichiers de traduction..." -ForegroundColor Cyan

# Fichier EN avec problèmes
$enFile = ".\src\i18n\locales\en.ts"
if (Test-Path $enFile) {
    $content = Get-Content $enFile -Raw -Encoding UTF8
    
    # Remplacer les caractères mal encodés
    $content = $content -replace 'cosmÃ©tique', 'cosmetique'
    $content = $content -replace 'hygiÃ¨ne', 'hygiene'
    $content = $content -replace 'dÃ©tergent', 'detergent'
    $content = $content -replace 'Ã©', 'e'
    $content = $content -replace 'Ã¨', 'e'
    $content = $content -replace 'Ã ', 'a'
    $content = $content -replace 'Ã¢', 'a'
    $content = $content -replace 'Ã´', 'o'
    $content = $content -replace 'Ã®', 'i'
    $content = $content -replace 'Ã¯', 'i'
    $content = $content -replace 'Ã§', 'c'
    $content = $content -replace 'Ã¹', 'u'
    $content = $content -replace 'Ã»', 'u'
    $content = $content -replace 'Å"', 'oe'
    $content = $content -replace 'Ã', 'A'
    
    # Écrire le fichier corrigé
    [System.IO.File]::WriteAllText($enFile, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "✅ Fichier EN corrigé" -ForegroundColor Green
}

# Fichier FR avec problèmes potentiels
$frFile = ".\src\i18n\locales\fr.ts"
if (Test-Path $frFile) {
    $content = Get-Content $frFile -Raw -Encoding UTF8
    
    # S'assurer que les accents sont corrects en FR
    $corrections = @{
        'cosmÃ©tique' = 'cosmétique'
        'hygiÃ¨ne' = 'hygiène'
        'dÃ©tergent' = 'détergent'
        'santÃ©' = 'santé'
        'qualitÃ©' = 'qualité'
        'sÃ©curitÃ©' = 'sécurité'
        'Ã©cologique' = 'écologique'
        'Ã©thique' = 'éthique'
        'ingrÃ©dients' = 'ingrédients'
        'rÃ©sultats' = 'résultats'
        'dÃ©tails' = 'détails'
        'gÃ©nÃ©ral' = 'général'
        'crÃ©er' = 'créer'
        'Ã ' = 'à'
        'Ã©' = 'é'
        'Ã¨' = 'è'
        'Ãª' = 'ê'
        'Ã§' = 'ç'
        'Ã´' = 'ô'
        'Ã®' = 'î'
        'Ã¹' = 'ù'
        'Ã»' = 'û'
    }
    
    foreach ($bad in $corrections.Keys) {
        $content = $content -replace $bad, $corrections[$bad]
    }
    
    [System.IO.File]::WriteAllText($frFile, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "✅ Fichier FR corrigé" -ForegroundColor Green
}

Write-Host "`n✨ Correction terminée!" -ForegroundColor Yellow
