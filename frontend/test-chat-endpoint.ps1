# Script PowerShell complet pour tester l'endpoint chat ECOLOJIA
# PATH: test-chat-endpoint.ps1

Write-Host "=== TEST ENDPOINT CHAT ECOLOJIA ===" -ForegroundColor Cyan

# Étape 1 : Login et obtention du token
Write-Host "`n[1] Connexion au serveur..." -ForegroundColor Yellow

$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "https://ecolojia-backendvf.onrender.com/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    $token = $loginResponse.token
    Write-Host "✅ Login réussi ! Token obtenu." -ForegroundColor Green
    Write-Host "Token (premiers caractères) : $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur lors du login : $_" -ForegroundColor Red
    exit 1
}

# Étape 2 : Test de l'endpoint chat
Write-Host "`n[2] Test de l'endpoint /api/ai/chat..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$chatBody = @{
    message = "Qu'est-ce que le système NOVA ?"
    context = @{
        productName = "Test Product"
        productType = "food"
    }
} | ConvertTo-Json

Write-Host "Headers envoyés :" -ForegroundColor Gray
$headers | Format-List

Write-Host "`nBody envoyé :" -ForegroundColor Gray
$chatBody

try {
    Write-Host "`n[3] Envoi de la requête..." -ForegroundColor Yellow
    
    $chatResponse = Invoke-RestMethod -Uri "https://ecolojia-backendvf.onrender.com/api/ai/chat" `
        -Method POST `
        -Headers $headers `
        -Body $chatBody `
        -ContentType "application/json"
    
    Write-Host "✅ Réponse reçue avec succès !" -ForegroundColor Green
    Write-Host "`nRéponse complète :" -ForegroundColor Cyan
    $chatResponse | ConvertTo-Json -Depth 10
    
} catch {
    $errorDetails = $_.Exception.Response
    $statusCode = [int]$errorDetails.StatusCode
    
    Write-Host "❌ Erreur endpoint chat !" -ForegroundColor Red
    Write-Host "Code HTTP : $statusCode" -ForegroundColor Red
    Write-Host "Message : $_" -ForegroundColor Red
    
    # Essayer de lire le body de l'erreur
    if ($errorDetails) {
        try {
            $reader = New-Object System.IO.StreamReader($errorDetails.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "`nDétails de l'erreur :" -ForegroundColor Red
            Write-Host $errorBody -ForegroundColor Gray
        } catch {
            Write-Host "Impossible de lire les détails de l'erreur" -ForegroundColor Gray
        }
    }
}

# Étape 3 : Test alternatif avec différents formats
Write-Host "`n[4] Test avec format alternatif..." -ForegroundColor Yellow

$altChatBody = @{
    query = "Comment fonctionne le Nutri-Score ?"
    type = "question"
} | ConvertTo-Json

try {
    $altResponse = Invoke-RestMethod -Uri "https://ecolojia-backendvf.onrender.com/api/ai/chat" `
        -Method POST `
        -Headers $headers `
        -Body $altChatBody `
        -ContentType "application/json"
    
    Write-Host "✅ Format alternatif accepté !" -ForegroundColor Green
    $altResponse | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "❌ Format alternatif également rejeté" -ForegroundColor Red
}

# Étape 4 : Vérifier d'autres endpoints AI
Write-Host "`n[5] Vérification d'autres endpoints AI possibles..." -ForegroundColor Yellow

$alternativeEndpoints = @(
    "/api/chat",
    "/api/ai",
    "/api/ai/question",
    "/api/assistant",
    "/api/deepseek/chat"
)

foreach ($endpoint in $alternativeEndpoints) {
    Write-Host "`nTest de $endpoint..." -ForegroundColor Gray
    try {
        $testResponse = Invoke-WebRequest -Uri "https://ecolojia-backendvf.onrender.com$endpoint" `
            -Method POST `
            -Headers $headers `
            -Body $chatBody `
            -ContentType "application/json" `
            -UseBasicParsing
        
        Write-Host "✅ Endpoint $endpoint existe ! (Code: $($testResponse.StatusCode))" -ForegroundColor Green
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -eq 404) {
            Write-Host "⚠️ Endpoint $endpoint n'existe pas (404)" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Endpoint $endpoint erreur $statusCode" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== FIN DES TESTS ===" -ForegroundColor Cyan