# 📋 STRATÉGIE CONTENU & DOCUMENTATION GLOBALE
## Ecolojia V3 - Content Strategy

Date : 01/11/2025 17:29

---

## 🎯 OBJECTIFS ÉDITORIAUX

### Vision Ecolojia
> Devenir la référence scientifique et pédagogique du "naturel éclairé" pour le foyer français (alimentation, cosmétique, détergent).

### Principes Éditoriaux
1. **Scientifique** : Sources fiables (OMS, ANSES, EFSA, ADEME)
2. **Pédagogique** : Expliquer sans jargon, rendre accessible
3. **Neutre** : Pas de jugement moral, informer objectivement
4. **Actionnable** : Toujours proposer une alternative concrète

---

## 📄 PAGES LÉGALES (Priorité CRITIQUE)

### 1. Mentions Légales (LegalPage.tsx)
**État actuel** : À auditer
**Contenu requis** :
- Éditeur : Nom société, SIRET, Adresse
- Directeur publication : Nom + contact
- Hébergeur : Render.com (backend) + Netlify (frontend)
- Propriété intellectuelle : © Ecolojia 2025
- CNIL : Déclaration traitement données
- Contact : contact@ecolojia.com

**Deadine** : AVANT déploiement production

---

### 2. Politique de Confidentialité (PrivacyPage.tsx)
**État actuel** : À auditer
**Contenu requis (RGPD)** :
- Responsable traitement : Coordonnées
- Données collectées : Liste exhaustive
  - Compte : email, prénom, préférences alimentaires
  - Scans : historique produits (anonymisé)
  - IA : conversations (anonymisées après 30j)
  - Analytics : usage app (Google Analytics opt-in)
- Finalités : Score personnalisé, recommandations IA
- Base légale : Consentement utilisateur
- Durée conservation : 
  - Compte actif : illimité
  - Compte inactif >2 ans : suppression auto
  - Logs : 1 an
- Droits utilisateur : Accès, rectification, suppression, export
- Cookies : Liste + opt-in/opt-out
- Sous-traitants : DeepSeek IA, Google Vision, Stripe
- Contact DPO : dpo@ecolojia.com

**Deadline** : AVANT déploiement production

---

### 3. Conditions Générales d'Utilisation (TermsPage.tsx)
**État actuel** : À auditer
**Contenu requis** :
- Acceptation CGU : obligatoire à l'inscription
- Services proposés :
  - Gratuit : scan, score, alternatives limitées (10 IA/mois)
  - Premium : IA illimitée, dashboard, plans repas (9.90€/mois)
- Responsabilité :
  - Disclaimer santé : "Ecolojia est informatif, pas médical"
  - Disclaimer IA : "Estimations scientifiques, pas certitudes"
  - Limitation responsabilité : Pas responsable décisions utilisateur
- Propriété intellectuelle : Scores & méthode © Ecolojia
- Modifications CGU : Notification 30j avant
- Résiliation : À tout moment par utilisateur
- Droit applicable : Français
- Litiges : Juridiction Paris

**Deadline** : AVANT déploiement production

---

### 4. Politique Cookies
**État actuel** : À créer (nouvelle page)
**Contenu requis** :
- Cookies essentiels : Session, auth JWT
- Cookies analytics : Google Analytics (opt-in)
- Cookies marketing : Aucun
- Bannière consentement : Choix granulaire
- Gestion consentement : Page dédiée dans Profil

**Deadline** : AVANT déploiement production

---

## 📚 PAGES INFORMATIVES

### 5. À Propos (AboutPage.tsx)
**État actuel** : À auditer
**Contenu recommandé** :

#### Notre Mission
> "Rendre la consommation naturelle accessible à tous, grâce à la science et l'intelligence artificielle."

#### Notre Histoire
- Création : 2024
- Fondateur : [Nom]
- Pourquoi Ecolojia : Besoin clarté face aux labels confus

#### Notre Méthode
- Scoring scientifique 8 composantes
- Sources : OMS, ANSES, EFSA, ADEME, OFF
- IA pédagogique : DeepSeek pour expliquer
- Transparence : Code méthodologie public

#### Notre Équipe
- Fondateurs
- Comité scientifique (advisors)
- Contact : contact@ecolojia.com

**Deadline** : Semaine 2

---

### 6. Méthodologie (Nouvelle page)
**URL** : /methodologie
**Contenu recommandé** :

#### Comment Nous Calculons Les Scores

**Les 8 Composantes** :
1. Transformation (NOVA) - 15%
2. Nutri-Score - 20%
3. Additifs - 15%
4. Sucres - 10%
5. Graisses saturées - 10%
6. Sel - 10%
7. Eco-Score - 15%
8. Labels éthiques - 5%

**Sources Scientifiques** :
- Nutri-Score : Santé Publique France
- NOVA : INSERM
- Additifs : EFSA
- Eco-Score : ADEME

**Limitations & Transparence** :
- "Nos scores sont informatifs, pas prescriptifs"
- "Sources : bases ouvertes (OFF, OBF)"
- "IA : estimations quand données manquantes"

**Changelog** : Historique versions scoring

**Deadline** : Semaine 2

---

### 7. FAQ (Nouvelle page)
**URL** : /faq
**Questions essentielles** :

#### Général
- C'est quoi Ecolojia ?
- C'est gratuit ?
- Différence Gratuit vs Premium ?
- Comment scanner un produit ?

#### Scoring
- Comment sont calculés les scores ?
- Pourquoi mon produit préféré a un mauvais score ?
- Qu'est-ce que le Nutri-Score ? NOVA ? Eco-Score ?
- Les scores sont-ils fiables ?

#### IA
- Comment fonctionne l'IA ?
- L'IA peut-elle se tromper ?
- Mes données sont-elles utilisées pour entraîner l'IA ?

#### Données & Vie privée
- Qui voit mes scans ?
- Puis-je supprimer mes données ?
- Comment exporter mes données ?

#### Premium
- C'est quoi Premium ?
- Comment annuler ?
- Remboursement ?

**Deadline** : Semaine 3

---

## 📖 DOCUMENTATION IN-APP

### 8. Tooltips & Explications Contextuelles
**Où** : Sur chaque composante de score

**Exemples** :
- **NOVA** : "Classification selon degré de transformation industrielle (1=brut, 4=ultra-transformé)"
- **Nutri-Score** : "Note de A à E basée sur qualité nutritionnelle globale"
- **Eco-Score** : "Impact environnemental (production, transport, emballage)"

**Deadline** : Semaine 1

---

### 9. Glossaire Intégré
**Où** : Lien depuis tooltips + page dédiée

**Termes** :
- Additif
- Nutri-Score
- NOVA
- Eco-Score
- Ultra-transformé
- Perturbateur endocrinien
- Label bio
- Empreinte carbone

**Deadline** : Semaine 2

---

## 🎓 CONTENU ÉDUCATIF (Blog/Apprendre)

### 10. Section "Apprendre" (Nouvelle)
**URL** : /apprendre

**Catégories** :
1. **Alimentation**
   - Comprendre les additifs
   - Décrypter les étiquettes
   - Sucres cachés
   - Graisses : les bonnes vs les mauvaises

2. **Cosmétiques**
   - Ingrédients à éviter
   - Labels cosmétiques
   - Perturbateurs endocriniens

3. **Détergents**
   - Tensioactifs : c'est quoi ?
   - Lessive écologique
   - Alternatives naturelles

4. **Mythes & Réalité**
   - "Bio = toujours sain ?"
   - "Sans gluten = meilleur ?"
   - "Détox : info ou intox ?"

**Format** : Articles courts (500-800 mots), vulgarisés, sourcés

**Deadline** : Post-beta (Semaine 4+)

---

## 📊 CONTENU MARKETING

### 11. Landing Page Optimisée (HomePage.tsx)
**Éléments clés** :
- Hero : "Scannez. Comprenez. Choisissez mieux."
- Bénéfices : 3 piliers (Santé, Planète, Transparence)
- Social proof : "X produits analysés, Y utilisateurs"
- CTA : "Scanner mon premier produit"
- Rassurance : Gratuit, sans engagement

**Deadline** : Semaine 2

---

### 12. Page Pricing Améliorée (PricingPage.tsx)
**Structure** :
- Tableau Gratuit vs Premium
- FAQ intégrée (questions pricing)
- Témoignages utilisateurs (si disponibles)
- Garantie : "Annulation en 1 clic"

**Deadline** : Semaine 3

---

## 🔗 LIENS EXTERNES À AJOUTER

### Footer
- Mentions légales
- Politique confidentialité
- CGU
- Politique cookies
- À propos
- Méthodologie
- FAQ
- Contact
- Presse

### Réseaux sociaux (si applicable)
- Twitter/X
- Instagram
- LinkedIn

---

## 📝 CHECKLIST CONTENU AVANT PROD

- [ ] Mentions légales complètes
- [ ] Politique confidentialité RGPD
- [ ] CGU validées juridiquement
- [ ] Politique cookies + bannière consentement
- [ ] Page À Propos finalisée
- [ ] Page Méthodologie publiée
- [ ] FAQ (20+ questions)
- [ ] Tooltips sur toutes les composantes
- [ ] Disclaimers santé/IA partout
- [ ] Contact : contact@ecolojia.com opérationnel
- [ ] DPO : dpo@ecolojia.com opérationnel

---

## 🎯 ORDRE DE PRIORITÉ

### CRITIQUE (Semaine 1) :
1. Mentions légales
2. Politique confidentialité
3. CGU
4. Disclaimers santé/IA

### IMPORTANT (Semaine 2) :
5. À propos
6. Méthodologie
7. Landing page

### SOUHAITABLE (Semaine 3+) :
8. FAQ
9. Glossaire
10. Section "Apprendre"

---

## 📧 CONTACTS À CRÉER

- contact@ecolojia.com (support général)
- dpo@ecolojia.com (RGPD)
- presse@ecolojia.com (média)
- security@ecolojia.com (sécurité)

---

## ✅ VALIDATION JURIDIQUE

**IMPORTANT** : Faire relire par un avocat spécialisé avant déploiement :
- Mentions légales
- Politique confidentialité (RGPD)
- CGU
- Disclaimers santé

**Budget recommandé** : 500-1000€ pour validation juridique complète

