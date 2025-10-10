PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes> # === TEST HEALTH ===

PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes>

PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes> Write-Host "`n Test 1 - Backend Health" -ForegroundColor Cyan                                                                                                                                                                                                                                          Test 1 - Backend Health                                                                                              PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes>

PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes> try {

>>     $health = Invoke-WebRequest -Uri "http://localhost:10000/api/health" -UseBasicParsing

>>     $healthJson = $health.Content | ConvertFrom-Json

>>

>>     Write-Host "✅ Backend répond" -ForegroundColor Green

>>     Write-Host "Status:" $healthJson.status -ForegroundColor White

>>     Write-Host "MongoDB:" $healthJson.mongodb -ForegroundColor White

>>

>> } catch {

>>     Write-Host "❌ Backend ne répond pas !" -ForegroundColor Red

>>     Write-Host $\_.Exception.Message -ForegroundColor Red

>> }

✅ Backend répond

Status: healthy

MongoDB:

PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes> # === TEST DEEPSEEK SANS CACHE ===

PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes>

PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes> Write-Host "`n🧪 Test 2 - DeepSeek Direct (sans cache)" -ForegroundColor Cyan



🧪 Test 2 - DeepSeek Direct (sans cache)

PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes>

PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes> # Question simple SANS productId (pas de cache)         PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes> $simpleBody = @{                                        >>     message = "Bonjour"                                                                                              >> } | ConvertTo-Json                                                                                                   PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes>

PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes> try {

>>     $deepseek = Invoke-WebRequest -Uri "http://localhost:10000/api/chat/deepseek" `

>>         -Method POST `

>>         -Body $simpleBody `

>>         -ContentType "application/json" `

>>         -UseBasicParsing

>>

>>     $deepseekJson = $deepseek.Content | ConvertFrom-Json

>>

>>     Write-Host "✅ DeepSeek répond !" -ForegroundColor Green

>>     Write-Host "Réponse:" $deepseekJson.response.substring(0, 100) -ForegroundColor White

>>

>> } catch {

>>     Write-Host "❌ DeepSeek ne répond pas" -ForegroundColor Red

>>     Write-Host "Erreur:" $\_.Exception.Message -ForegroundColor Red

>>

>>     # Extraire le message d'erreur du serveur

>>     if ($\_.ErrorDetails.Message) {

>>         $errorJson = $\_.ErrorDetails.Message | ConvertFrom-Json

>>         Write-Host "Détail serveur:" $errorJson.detail -ForegroundColor Yellow

>>     }

>> }

✅ DeepSeek répond !

❌ DeepSeek ne répond pas

Erreur: Impossible d’appeler une méthode dans une expression Null.

PS C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\backend\\src\\routes>

