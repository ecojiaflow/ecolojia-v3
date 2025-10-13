const axios = require('axios');
const { 
  checkUrgentPatterns, 
  checkPersonalMedicalQuestion,
  requiresMedicalDisclaimer 
} = require('../middleware/chatSafety');
const {
  FOOD_SYSTEM_PROMPT,
  COSMETIC_SYSTEM_PROMPT,
  DETERGENT_SYSTEM_PROMPT,
  MEDICAL_DISCLAIMER
} = require('../config/prompts.config');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE = 'https://api.deepseek.com';

async function deepseekChat(req, res) {
  try {
    const { messages = [], productContext, userProfile } = req.body || {};

    // Récupérer dernier message utilisateur
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();

    if (lastUserMessage) {
      // =====================================================================
      // 1. VÉRIFICATION URGENCE VITALE (priorité absolue)
      // =====================================================================
      const urgentCheck = checkUrgentPatterns(lastUserMessage.content);
      if (urgentCheck.isUrgent) {
        return res.json({
          reply: urgentCheck.response,
          isUrgent: true,
          urgentType: urgentCheck.type
        });
      }

      // =====================================================================
      // 2. VÉRIFICATION QUESTION MÉDICALE PERSONNELLE (nouvelle protection)
      // =====================================================================
      const medicalCheck = checkPersonalMedicalQuestion(lastUserMessage.content);
      if (medicalCheck.isPersonalMedical) {
        return res.json({
          reply: medicalCheck.response,
          isPersonalMedical: true,
          medicalType: medicalCheck.type
        });
      }
    }

    // =====================================================================
    // 3. Si question OK → Sélectionner prompt scientifique
    // =====================================================================
    let systemPrompt;
    if (productContext) {
      switch(productContext.category) {
        case 'cosmetics':
          systemPrompt = COSMETIC_SYSTEM_PROMPT(productContext);
          break;
        case 'detergents':
          systemPrompt = DETERGENT_SYSTEM_PROMPT(productContext);
          break;
        default:
          systemPrompt = FOOD_SYSTEM_PROMPT(productContext, userProfile);
      }
    } else {
      systemPrompt = FOOD_SYSTEM_PROMPT(null, userProfile);
    }

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const payload = {
      model: 'deepseek-chat',
      messages: chatMessages,
      temperature: 0.3,
      max_tokens: 500
    };

    const r = await axios.post(DEEPSEEK_BASE + '/chat/completions', payload, {
      headers: {
        'Authorization': 'Bearer ' + DEEPSEEK_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    let reply = r.data?.choices?.[0]?.message?.content ?? 'Désolé, aucune réponse.';

    // =====================================================================
    // 4. AJOUTER DISCLAIMER si détection mots-clés médicaux généraux
    // =====================================================================
    if (lastUserMessage && requiresMedicalDisclaimer(lastUserMessage.content)) {
      reply += `\n\n${MEDICAL_DISCLAIMER}`;
    }

    res.json({ reply });

  } catch (err) {
    console.error('[DeepSeek]', err?.response?.status, err?.response?.data || err?.message);
    res.status(500).json({
      error: 'Chat DeepSeek indisponible',
      detail: err?.response?.data || err?.message || String(err)
    });
  }
}

module.exports = { deepseekChat };
