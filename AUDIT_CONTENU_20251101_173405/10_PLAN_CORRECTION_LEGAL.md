# 🔧 PLAN DE CORRECTION PAGES LÉGALES
Date : 01/11/2025 17:34

---

## 🎯 OBJECTIF

Corriger encodage + compléter pages légales AVANT déploiement production.

---

## ✅ ÉTAPE 1 : CORRECTION ENCODAGE (30 min)

### Fichiers à corriger :
- frontend/src/pages/PrivacyPage.tsx - frontend/src/pages/TermsPage.tsx

### Actions :
1. Ouvrir chaque fichier dans VS Code
2. Ctrl+Shift+P → "Change File Encoding"
3. Choisir "UTF-8 with BOM"
4. Sauvegarder
5. Vérifier caractères spéciaux (à, é, è, ç)

---

## ✅ ÉTAPE 2 : COMPLÉTER MENTIONS LÉGALES (1h)

### Fichier : frontend/src/pages/LegalPage.tsx

**Contenu requis** :
```tsx
// Template à intégrer
const legalContent = {
  editor: {
    name: "Ecolojia (ou nom société)",
    siret: "[À COMPLÉTER]",
    address: "[Adresse siège social]",
    phone: "[Téléphone]",
    email: "contact@ecolojia.com"
  },
  director: {
    name: "[Directeur publication]",
    role: "Directeur de la publication"
  },
  host: {
    backend: "Render.com",
    frontend: "Netlify",
    details: "[Coordonnées hébergeur si requis]"
  },
  intellectual: {
    copyright: "© Ecolojia 2025. Tous droits réservés.",
    method: "La méthodologie de scoring est propriété d'Ecolojia."
  },
  cnil: {
    declaration: "[Numéro déclaration CNIL si applicable]",
    dpo: "dpo@ecolojia.com"
  }
};
```

---

## ✅ ÉTAPE 3 : COMPLÉTER POLITIQUE CONFIDENTIALITÉ (2h)

### Fichier : frontend/src/pages/PrivacyPage.tsx

**Sections requises (RGPD)** :

1. **Responsable de traitement**
   - Nom société
   - Adresse
   - Contact DPO : dpo@ecolojia.com

2. **Données collectées**
   - Compte : email, prénom, préférences
   - Scans : historique produits (anonymisé)
   - IA : conversations (anonymisées après 30j)
   - Analytics : usage (opt-in Google Analytics)

3. **Finalités**
   - Scoring personnalisé
   - Recommandations IA
   - Amélioration service

4. **Base légale**
   - Consentement utilisateur (opt-in explicite)

5. **Durée conservation**
   - Compte actif : illimité
   - Compte inactif >2 ans : suppression auto
   - Logs : 1 an

6. **Droits utilisateur**
   - Accès (voir mes données)
   - Rectification (modifier)
   - Suppression (effacer mon compte)
   - Export (télécharger mes données)
   - Opposition (opt-out analytics)
   - Contact : dpo@ecolojia.com

7. **Sous-traitants**
   - DeepSeek (IA enrichissement)
   - Google Vision (OCR)
   - Stripe (paiement)
   - Render.com (hébergement backend)
   - Netlify (hébergement frontend)

8. **Cookies**
   - Essentiels : session, auth JWT
   - Analytics : Google Analytics (opt-in)
   - Bannière consentement granulaire

9. **Sécurité**
   - Chiffrement données
   - Accès restreints
   - Audits réguliers

---

## ✅ ÉTAPE 4 : COMPLÉTER CGU (1h)

### Fichier : frontend/src/pages/TermsPage.tsx

**Sections requises** :

1. **Acceptation**
   - Obligatoire à l'inscription
   - Modification = notification 30j avant

2. **Services**
   - Gratuit : scan, score, 10 IA/mois
   - Premium : IA illimitée, dashboard, 9.90€/mois

3. **Responsabilité**
   - ⚠️ **Disclaimer santé** : "Ecolojia est informatif, pas médical. Consultez un professionnel."
   - ⚠️ **Disclaimer IA** : "Les estimations IA sont scientifiques mais pas certitudes."
   - Limitation : Pas responsable décisions utilisateur

4. **Propriété intellectuelle**
   - Scores & méthode © Ecolojia
   - Bases données ouvertes (OFF, OBF) : licences respectives

5. **Résiliation**
   - Utilisateur : à tout moment
   - Ecolojia : abus, non-paiement (notification 15j)

6. **Droit applicable**
   - Droit français
   - Juridiction : Paris

---

## ✅ ÉTAPE 5 : CRÉER PAGE COOKIES (30 min)

### Nouveau fichier : frontend/src/pages/CookiesPage.tsx

**Contenu** :
```tsx
// Liste des cookies utilisés
const cookies = {
  essential: [
    {
      name: "ecolojia_session",
      purpose: "Session utilisateur",
      duration: "Session",
      required: true
    },
    {
      name: "ecolojia_auth",
      purpose: "Authentification JWT",
      duration: "7 jours",
      required: true
    }
  ],
  analytics: [
    {
      name: "_ga, _gid",
      purpose: "Google Analytics - usage app",
      duration: "2 ans",
      required: false,
      optIn: true
    }
  ]
};
```

**Bannière consentement** : Intégrer dans Layout principal avec choix granulaire.

---

## ✅ ÉTAPE 6 : DISCLAIMERS GLOBAUX (1h)

### Ajouter disclaimers sur TOUTES les pages avec score/IA :

**Disclaimer Santé** (ProductPage, ResultsPage, etc.) :
```tsx
<div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
  ℹ️ Les scores Ecolojia sont informatifs et pédagogiques. 
  Ils ne remplacent pas l'avis d'un professionnel de santé.
</div>
```

**Disclaimer IA** (ChatPage, EnrichmentResult, etc.) :
```tsx
<div className="bg-purple-50 border border-purple-200 rounded p-3 text-sm">
  🤖 Notre IA utilise des sources scientifiques pour estimer les valeurs manquantes. 
  Ces estimations sont des approximations, pas des certitudes.
</div>
```

---

## 📧 ÉTAPE 7 : EMAILS À CRÉER

### Adresses requises :
- **contact@ecolojia.com** → Support général
- **dpo@ecolojia.com** → RGPD / Données personnelles
- **security@ecolojia.com** → Sécurité
- **presse@ecolojia.com** → Relations média (optionnel)

**Action** : Configurer sur hébergeur email (Google Workspace, OVH, etc.)

---

## ⚖️ ÉTAPE 8 : VALIDATION JURIDIQUE (CRITIQUE)

### Pourquoi ?
- RGPD = sanctions jusqu'à 4% CA ou 20M€
- CGU mal rédigées = litiges utilisateurs
- Disclaimers santé = responsabilité civile

### Action recommandée :
1. Faire relire par avocat spécialisé :
   - Droit numérique
   - Protection données (RGPD)
   - Santé (disclaimers)

2. Budget : 500-1000€
3. Délai : 1-2 semaines

**⚠️ NE PAS DÉPLOYER EN PROD SANS VALIDATION JURIDIQUE**

---

## 📅 PLANNING RECOMMANDÉ

| Étape | Durée | Deadline |
|-------|-------|----------|
| 1. Encodage | 30 min | Immédiat |
| 2. Mentions légales | 1h | Jour 1 |
| 3. Confidentialité | 2h | Jour 1-2 |
| 4. CGU | 1h | Jour 2 |
| 5. Page cookies | 30 min | Jour 2 |
| 6. Disclaimers | 1h | Jour 3 |
| 7. Emails | 1h | Jour 3 |
| 8. Validation juridique | 1-2 semaines | Avant prod |

**TOTAL** : 7h de travail + validation juridique

---

## ✅ CHECKLIST FINALE

- [ ] Encodage UTF-8 BOM partout
- [ ] Mentions légales complètes
- [ ] Politique confidentialité RGPD complète
- [ ] CGU complètes
- [ ] Page cookies + bannière consentement
- [ ] Disclaimers santé/IA sur toutes pages concernées
- [ ] Emails opérationnels
- [ ] Validation juridique OK
- [ ] Tests manuels (lire toutes les pages)
- [ ] Liens footer corrects

