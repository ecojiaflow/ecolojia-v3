const fetch = require('node-fetch');

function toText(value) {
  if (value === null || value === undefined) return '';
  // Si c'est déjà une chaîne
  if (typeof value === 'string') return value;
  // Si c'est un tableau de segments {type,text} → concat
  if (Array.isArray(value)) {
    try {
      return value.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
    } catch { return String(value); }
  }
  // Objets divers → JSON compact
  try { return JSON.stringify(value); } catch { return String(value); }
}

function normalizeMessages(rawMessages = [], context = {}) {
  const base = [
    {
      role: 'system',
      content:
        'Tu es Ecolojia, assistant recettes & nutrition. Réponds brièvement, en français, avec des conseils concrets et sûrs.'
    }
  ];

  const mapped = rawMessages.map(m => ({
    role: (m && m.role) ? m.role : 'user',
    content: toText(m && m.content)
  }));

  // Ajout contexte produit/recette s’ils existent
  if (context && (context.product || context.recipe)) {
    const ctxText = toText({ product: context.product || null, recipe: context.recipe || null });
    mapped.unshift({ role: 'system', content: `Contexte: ${ctxText}` });
  }

  return base.concat(mapped);
}

async function chat({ apiKey, model = 'deepseek-chat', messages = [], temperature = 0.3, context = {} }) {
  if (!apiKey) throw new Error('DeepSeek API key manquante (DEEPSEEK_API_KEY)');
  const url = 'https://api.deepseek.com/chat/completions';

  const payload = {
    model,
    temperature,
    messages: normalizeMessages(messages, context)
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (json && json.error && json.error.message) ? json.error.message : `HTTP ${res.status}`;
    throw new Error(`DeepSeek API error: ${msg}`);
  }

  const choice = json.choices && json.choices[0];
  const text = choice && choice.message && choice.message.content ? choice.message.content : '';
  return { text, raw: json };
}

// Compat: ancien nom "analyze" utilisé par chat.routes.js
async function analyze(opts) {
  return chat(opts);
}

module.exports = { chat, analyze, normalizeMessages };