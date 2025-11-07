# 📋 CHECKLIST PRÉ-PRODUCTION - Ecolojia V3
Date : 01/11/2025 17:24

---

## 🎯 PRIORITÉ 1 : CRITIQUE (Avant déploiement)

### 1.1 Cohérence Desktop/Mobile
- [ ] Tester toutes les pages en responsive (320px → 2560px)
- [ ] Vérifier navigation mobile (PWA)
- [ ] Tester dashboard desktop
- [ ] Valider ProductPage mobile
- [ ] Tester scan/OCR mobile

### 1.2 Assistant IA Global
- [ ] Intégrer assistant IA dans toutes les pages principales
- [ ] Contexte utilisateur persistant (derniers scans, préférences)
- [ ] Widget flottant ou bouton permanent
- [ ] Historique conversations
- [ ] Suggestions contextuelles par page

### 1.3 OCR + Scan Produits Inexistants
- [ ] Tester OCR (Google Vision + Tesseract)
- [ ] Workflow : Photo → OCR → Parsing → Enrichissement IA → Save DB
- [ ] Gestion erreurs OCR
- [ ] Feedback utilisateur (loading, erreurs, succès)
- [ ] Tag produit comme "user_contributed"

### 1.4 Encodage & Caractères
- [ ] Audit complet encodage UTF-8 (frontend + backend)
- [ ] Corriger caractères arabes/spéciaux mal affichés
- [ ] Tester ingrédients multilingues
- [ ] Vérifier noms de marques accentués

---

## 🎯 PRIORITÉ 2 : IMPORTANT (Pré-beta)

### 2.1 Catégories Détergent & Cosmétique
- [ ] Compléter données détergents (comme alimentaire)
- [ ] Compléter données cosmétiques (comme alimentaire)
- [ ] Scoring cohérent 8 composantes
- [ ] Alternatives pour détergents
- [ ] Alternatives pour cosmétiques

### 2.2 Photos Produits
- [ ] Afficher images dans résultats recherche
- [ ] Fallback si pas d'image (placeholder)
- [ ] Lazy loading images
- [ ] Optimisation taille/poids

### 2.3 Pages Essentielles
- [ ] Dashboard utilisateur (scores moyens, tendances)
- [ ] Profil utilisateur (préférences, allergènes, objectifs)
- [ ] Historique scans/recherches
- [ ] Favoris avec organisation

---

## 🎯 PRIORITÉ 3 : SOUHAITABLE (Post-beta)

### 3.1 Fonctionnalités Avancées
- [ ] Plans repas IA
- [ ] Listes de courses intelligentes
- [ ] Affiliation produits (≥75/100)
- [ ] Module paiement Premium
- [ ] Export données (RGPD)

### 3.2 Design & UX
- [ ] Cohérence design system complet
- [ ] Animations/transitions fluides
- [ ] Dark mode (optionnel)
- [ ] Accessibilité (ARIA, contraste)

---

## 📊 MÉTRIQUES DE QUALITÉ

### Tests Manuels
- [ ] 10 produits alimentaires (scan + enrichissement)
- [ ] 5 produits cosmétiques
- [ ] 5 produits détergents
- [ ] 3 produits inexistants (OCR)

### Performance
- [ ] Lighthouse score >90
- [ ] Temps chargement <3s
- [ ] PWA installable
- [ ] Offline basique fonctionnel

### Conformité
- [ ] RGPD complet (consentements, export, suppression)
- [ ] Disclaimers santé/IA partout
- [ ] Mentions légales à jour
- [ ] Politique confidentialité

---

## 🚀 ROADMAP RECOMMANDÉE

### Semaine 1 : Fondations (Priorité 1)
- Jour 1-2 : OCR + Scan produits inexistants
- Jour 3-4 : Encodage UTF-8 complet
- Jour 5-6 : Assistant IA global
- Jour 7 : Tests cohérence desktop/mobile

### Semaine 2 : Catégories (Priorité 2)
- Jour 1-3 : Détergents + Cosmétiques (données + scoring)
- Jour 4-5 : Photos produits + résultats
- Jour 6-7 : Dashboard + Profil utilisateur

### Semaine 3 : Polissage (Priorité 3)
- Jour 1-2 : Design cohérent + UX
- Jour 3-4 : Plans repas + listes courses
- Jour 5 : Module affiliation
- Jour 6 : Module paiement
- Jour 7 : Tests finaux

### Semaine 4 : Pré-production
- Tests complets
- Corrections bugs
- Documentation
- Préparation chargement données

