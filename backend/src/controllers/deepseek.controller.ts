import { Request, Response } from 'express';
import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE = 'https://api.deepseek.com';

if (!DEEPSEEK_API_KEY) {
  console.warn('[DeepSeek] DEEPSEEK_API_KEY absente dans .env');
}

export async function deepseekChat(req: Request, res: Response) {
  try {
    const { messages = [], productContext } = req.body || {};

    const systemPrompt =
      "Tu es l'assistant nutritionnel d’ECOLOJIA.\n" +
      "Réponds en français, clairement, sans avis médical.\n" +
      "Utilise le contexte produit si fourni (ingrédients, labels, score).\n" +
      "Si tu n'es pas sûr, dis-le honnêtement.";

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...(productContext ? [{ role: 'system', content: Contexte produit:\n }] : []),
      ...messages
    ];

    const payload = {
      model: 'deepseek-chat',
      messages: chatMessages,
      temperature: 0.3
    };

    const r = await axios.post(\\/chat/completions\, payload, {
      headers: {
        'Authorization': \Bearer \\,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const reply = r.data?.choices?.[0]?.message?.content ?? 'Désolé, aucune réponse.';
    res.json({ reply });
  } catch (err: any) {
    console.error('[DeepSeek]', err?.response?.status, err?.response?.data || err?.message || err);
    res.status(500).json({
      error: 'Chat DeepSeek indisponible',
      detail: err?.response?.data || err?.message || String(err)
    });
  }
}
