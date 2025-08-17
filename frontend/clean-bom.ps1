$configFiles = @(
    "postcss.config.js",
    "postcss.config.cjs",
    "tailwind.config.js",
    "vite.config.ts",
    "tsconfig.json",
    "package.json"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        # Supprimer le BOM s'il existe
        if ($content[0] -eq 0xFEFF -or $content.StartsWith([char]0xFEFF)) {
            $content = $content.TrimStart([char]0xFEFF)
            [System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
            Write-Host "BOM supprime de: $file" -ForegroundColor Green
        }
    }
}
