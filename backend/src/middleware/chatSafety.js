/**
 * Middleware détection urgences médicales
 * PRIORITÉ ABSOLUE sur toute réponse IA
 */

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

function requiresMedicalDisclaimer(message) {
  const medicalKeywords = /diabète|cancer|maladie|traitement|médicament|enceinte|grossesse|allergique/i;
  return medicalKeywords.test(message);
}

module.exports = { 
  checkUrgentPatterns,
  requiresMedicalDisclaimer
};
