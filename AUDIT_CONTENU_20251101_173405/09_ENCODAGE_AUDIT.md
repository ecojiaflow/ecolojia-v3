# AUDIT ENCODAGE UTF-8
Date : 01/11/2025 17:34

## ⚠️ FICHIERS AVEC CARACTÈRES CORROMPUS

### ❌ PrivacyPage.tsx
**Problèmes détectés** :
- `Confidentialite`

### ❌ TermsPage.tsx
**Problèmes détectés** :
- `Generales`

## 🔧 ACTIONS RECOMMANDÉES

1. **Convertir tous les fichiers en UTF-8 BOM** :
```powershell
   # Depuis VS Code : Fichier > Enregistrer avec encodage > UTF-8 with BOM
```

2. **Remplacer caractères corrompus** :
   - `?` → `À`
   - `Confidentialite` → `Confidentialité`
   - `Generales` → `Générales`

3. **Vérifier i18n** : Si traductions externes, corriger les fichiers JSON

