// backend/src/services/ai/conversationalAI.js
const deepSeek = require('./deepSeekService');
const { v4: uuidv4 } = require('uuid');

class ConversationalAI {
  constructor() {
    /** Map<sessionId, {history: Array<{role,content}>}> */
    this.memory = new Map();
    this.LIMIT = 20; // max tours conservés
  }

  /**
   * Dialogue principal
   * @param {string} userMsg
   * @param {object} context   ex : { product:{…}, analysis:{…} }
   * @param {string} [session] identifiant session
   */
  async chat(userMsg, context = {}, session = uuidv4()) {
    const convo = this.memory.get(session) || { history: [] };

    /* Prompt système */
    const system = 'Tu es ECOLOJIA, expert nutrition, cosmétique et détergence. ' +
                   'Réponds brièvement, en français, avec des sources crédibles.';

    const messages = [
      { role: 'system', content: system },
      ...convo.history,
      { role: 'user', content: userMsg }
    ];

    if (context.product) {
      messages.push({
        role: 'user',
        content: `Contexte produit: ${JSON.stringify(context.product).substring(0, 500)}`
      });
    }

    const answer = await deepSeek.chat(messages, { temperature: 0.7 });

    /* Mémorisation */
    convo.history.push({ role: 'user', content: userMsg });
    convo.history.push({ role: 'assistant', content: answer });
    convo.history = convo.history.slice(-this.LIMIT);
    this.memory.set(session, convo);

    return { reply: answer, sessionId: session };
  }

  clear(session) { 
    this.memory.delete(session); 
  }
}

module.exports = new ConversationalAI();