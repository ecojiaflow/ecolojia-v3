# 🛡️ GUARDRAILS MÉDICAUX - DOCUMENTATION

## Date déploiement
2025-10-13 15:48:30

## Fichiers modifiés
- \ackend/src/middleware/chatSafety.js\ (75 → 143 lignes)
- \ackend/src/controllers/deepseek.controller.js\ (87 → 109 lignes)

## Fonctionnalités

### 1. Détection urgences vitales
- Urgences médicales (SAMU: 15)
- Allergies graves (antipoison: 01 40 05 48 48)
- Crises suicidaires (3114)
- Urgences grossesse

### 2. Détection questions médicales personnelles
**Patterns bloquants:**
- \personal_condition\: "J'ai du diabète...", "Je suis diabétique..."
- \amily_health\: "Mon fils est allergique...", "Ma femme enceinte..."
- \health_concern\: "Pour ma santé cardiaque...", "À cause de mon cholestérol..."
- \can_i_question\: "Puis-je manger...", "Dois-je éviter..."
- \pregnancy_food\: "Enceinte puis-je consommer..."
- \medical_advice\: "Me conseiller pour ma santé..."

### 3. Questions autorisées (passent à l'IA)
- Questions générales sur les produits
- Informations Nutri-Score et NOVA
- Composition et additifs
- Lecture d'étiquettes
- Impact environnemental

## Tests effectués
✅ 9/9 tests fonctionnels réussis (100%)

## Endpoint API
\POST /api/chat/deepseek\

**Body:**
\\\json
{
  "messages": [
    { "role": "user", "content": "Votre question" }
  ]
}
\\\

**Réponse si bloquée:**
\\\json
{
  "reply": "⚠️ Question médicale personnelle détectée...",
  "isPersonalMedical": true,
  "medicalType": "personal_condition"
}
\\\

## Rollback
En cas de problème, exécuter:
\\\powershell
.\backend\src\_BACKUP_XXXXXXXXX\ROLLBACK.ps1
\\\

## Maintenance
- Logs: Console backend
- Rate limiting: 10 requêtes/minute (configurable dans \ateLimiter.js\)
- Patterns: Modifiables dans \chatSafety.js\

## Contact
Pour questions ou ajustements, contacter l'équipe technique.
