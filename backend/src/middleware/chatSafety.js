/**
 * Middleware détection urgences médicales + questions personnelles
 * PRIORITÉ ABSOLUE sur toute réponse IA
 */

// ============================================================================
// 1. URGENCES VITALES (existant - conservé)
// ============================================================================

const URGENT_PATTERNS = {
  medical_emergency: /urgence|douleur.*(intense|aiguë|forte)|saigne|choc anaphylactique|difficulté.*(respirer|avaler)|œdème|gorge.*enfle/i,
  severe_allergy: /allergie.*(grave|sévère)|anaphyla|épipen|œdème|urticaire.*généralisée/i,
  mental_health: /suicide|suicidaire|me.*tuer|en.*finir|plus.*envie.*vivre/i,
  pregnancy_risk: /enceinte.*(saigne|douleur|contractions)|fausse.*couche/i
};

const CRISIS_RESPONSES = {
  medical_emergency: `🚨 URGENCE MÉDICALE DÉTECTÉE

➡️ APPELEZ IMMÉDIATEMENT :
   • SAMU : 15
   • Numéro d'urgence européen : 112

Je ne peux pas vous aider dans cette situation d'urgence vitale.
Un professionnel médical doit intervenir MAINTENANT.`,

  severe_allergy: `🚨 ALLERGIE GRAVE

➡️ ACTIONS URGENTES :
   • SAMU : 15
   • Centre antipoison : 01 40 05 48 48
   • Si EpiPen disponible : utiliser MAINTENANT

Agissez immédiatement, ne perdez pas de temps ici.`,

  mental_health: `🆘 AIDE PSYCHOLOGIQUE URGENTE

Vous n'êtes pas seul(e). Parlez à quelqu'un MAINTENANT :

➡️ 3114 - Prévention suicide (gratuit 24h/7j)
➡️ SOS Amitié : 09 72 39 40 50
➡️ Urgences psychiatriques : 15

Ces professionnels sont formés pour vous aider.`,

  pregnancy_risk: `⚠️ URGENCE GROSSESSE

➡️ Contactez IMMÉDIATEMENT :
   • SAMU : 15
   • Votre maternité/gynécologue

Ne prenez aucun risque, faites-vous examiner.`
};

function checkUrgentPatterns(message) {
  const lowerMessage = message.toLowerCase();

  for (const [type, pattern] of Object.entries(URGENT_PATTERNS)) {
    if (pattern.test(lowerMessage)) {
      return {
        isUrgent: true,
        type,
        response: CRISIS_RESPONSES[type]
      };
    }
  }

  return { isUrgent: false };
}

// ============================================================================
// 2. QUESTIONS MÉDICALES PERSONNELLES (NOUVEAU - CORRIGÉ)
// ============================================================================

const PERSONAL_MEDICAL_PATTERNS = {
  personal_condition: /\b(j'ai|je suis|j'ai été).*(diabète|diabétique|cancer|cancéreux|allergie|allergique|maladie|malade|traitement|enceinte|grossesse)/i,
  family_health: /\b(mon|ma|mes).*(enfant|fils|fille|bébé|femme|mari|parent|père|mère).*(diabète|allergie|maladie|allergique|intolérant)/i,
  health_concern: /\b(pour|à cause de).*(ma|mon).*(santé|cœur|cardiaque|cardiovasculaire|foie|hépatique|rein|rénal|diabète|diabétique|cholestérol|tension|artérielle|hypertension|thyroïde|glycémie|pancréas)/i,
  can_i_question: /\b(puis-je|peux-je|est-ce que je peux|dois-je|devrais-je).*(manger|consommer|prendre|éviter)/i,
  pregnancy_food: /\b(enceinte|grossesse).*(manger|consommer|éviter|risque|danger)/i,
  medical_advice: /\b(me|mon|ma).*(conseiller|recommander|avis).*(médical|santé|docteur)/i
};

const PERSONAL_MEDICAL_RESPONSE = `⚠️ Question médicale personnelle détectée

Je ne peux pas répondre aux questions concernant :
- Votre état de santé spécifique
- Vos traitements médicaux en cours
- Vos allergies ou intolérances personnelles
- Votre grossesse
- La santé de vos proches

🏥 **Pour un avis personnalisé, consultez** :
   • Votre médecin traitant
   • Un nutritionniste diplômé (diététicien-nutritionniste)
   • Votre pharmacien

💡 **Je peux vous aider sur** :
   • Composition générale des produits
   • Lecture des étiquettes
   • Nutri-Score et classification NOVA
   • Additifs et leur fonction
   • Impact environnemental

📚 **Exemple de question générale** :
   "Qu'est-ce que le Nutri-Score ?"
   "Quels sont les additifs dans ce produit ?"
   "Comment lire une étiquette ?"`;

function checkPersonalMedicalQuestion(message) {
  const lowerMessage = message.toLowerCase();

  for (const [type, pattern] of Object.entries(PERSONAL_MEDICAL_PATTERNS)) {
    if (pattern.test(lowerMessage)) {
      return {
        isPersonalMedical: true,
        type,
        response: PERSONAL_MEDICAL_RESPONSE
      };
    }
  }

  return { isPersonalMedical: false };
}

// ============================================================================
// 3. DÉTECTION BESOIN DISCLAIMER (existant - conservé)
// ============================================================================

function requiresMedicalDisclaimer(message) {
  const medicalKeywords = /diabète|cancer|maladie|traitement|médicament|enceinte|grossesse|allergique/i;
  return medicalKeywords.test(message);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  checkUrgentPatterns,
  checkPersonalMedicalQuestion,
  requiresMedicalDisclaimer
};
