// PATH: backend/src/services/ai/deepSeekService.js
// FICHIER COMPLET - € CR‰ER TEL QUEL

const axios = require('axios');

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    this.model = 'deepseek-chat';
    
    if (!this.apiKey) {
      console.warn('[DeepSeek] API key not configured');
    }
  }

  async analyze(prompt, systemPrompt = null) {
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      console.log('[DeepSeek] Sending request...');

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('[DeepSeek] Response received');
      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('[DeepSeek] API error:', error.response?.data || error.message);
      
      if (process.env.OPENAI_API_KEY) {
        return this.fallbackToOpenAI(prompt, systemPrompt);
      }
      
      throw new Error('AI analysis failed');
    }
  }

  async fallbackToOpenAI(prompt, systemPrompt) {
    console.log('[DeepSeek] Falling back to OpenAI...');
    
    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo',
          messages,
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('[DeepSeek] OpenAI fallback successful');
      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('[DeepSeek] OpenAI fallback failed:', error.message);
      throw new Error('Both AI services failed');
    }
  }

  async analyzeProduct(productData, category) {
    const systemPrompt = this.getSystemPromptForCategory(category);
    const userPrompt = this.buildProductPrompt(productData, category);
    
    const response = await this.analyze(userPrompt, systemPrompt);
    
    return this.parseAIResponse(response, category);
  }

  getSystemPromptForCategory(category) {
    const prompts = {
      food: `Tu es un expert en nutrition et securite alimentaire. 
             Analyse les produits selon la classification NOVA, les additifs, et l'impact sante.
             Base-toi sur les donnees INSERM, ANSES et EFSA.
             Reponds de maniere structuree et scientifique.`,
      
      cosmetics: `Tu es un expert en cosmetique et dermatologie. 
                  Analyse les produits selon leur composition INCI, les perturbateurs endocriniens, et les allergenes.
                  Base-toi sur les donnees ANSM et SCCS.
                  Sois precis sur les risques cutanes.`,
      
      detergents: `Tu es un expert en produits menagers et impact environnemental. 
                   Analyse les produits selon leur toxicite, biodegradabilite, et impact aquatique.
                   Base-toi sur les donnees REACH et ECHA.
                   Mets l'accent sur la securite domestique.`
    };

    return prompts[category] || prompts.food;
  }

  buildProductPrompt(productData, category) {
    return `Analyse le produit suivant de maniere detaillee :

Nom: ${productData.name || productData.product_name || 'Non specifie'}
Marque: ${productData.brand || 'Non specifiee'}
Categorie: ${category}
Ingredients: ${productData.ingredients || productData.composition || productData.inci || 'Non specifies'}

Fournis une analyse structuree avec :
1. Score de sante global (0-100)
2. Score environnemental (0-100)
3. Points positifs (liste)
4. Points negatifs (liste)
5. Recommandations personnalisees (3 maximum)
6. Alternatives suggerees (3 maximum)

Format ta reponse de maniere claire avec des titres pour chaque section.`;
  }

  parseAIResponse(response, category) {
    const result = {
      analysis: response,
      scores: {
        health: this.extractScore(response, 'sante'),
        environment: this.extractScore(response, 'environnement'),
        ethics: 70
      },
      positives: this.extractListItems(response, 'positif'),
      negatives: this.extractListItems(response, 'negatif'),
      recommendations: this.extractListItems(response, 'recommandation'),
      alternatives: this.extractListItems(response, 'alternative'),
      timestamp: new Date(),
      aiModel: 'deepseek',
      category
    };

    return result;
  }

  extractScore(text, type) {
    const patterns = [
      new RegExp(`${type}[:\\s]*(\\d+)`, 'i'),
      new RegExp(`score[\\s]+${type}[:\\s]*(\\d+)`, 'i'),
      new RegExp(`${type}[\\s]*:[\\s]*(\\d+)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return Math.min(100, Math.max(0, parseInt(match[1])));
      }
    }

    return 50;
  }

  extractListItems(text, keyword) {
    const lines = text.split('\n');
    const items = [];
    let capturing = false;

    for (const line of lines) {
      if (line.toLowerCase().includes(keyword)) {
        capturing = true;
        continue;
      }

      if (capturing && line.trim()) {
        if (line.match(/^[A-Z]/)) {
          capturing = false;
          continue;
        }

        const cleaned = line.replace(/^[-â€¢*]\s*/, '').trim();
        if (cleaned && items.length < 5) {
          items.push(cleaned);
        }
      }
    }

    return items;
  }

  async chat(message, context = {}) {
    const systemPrompt = `Tu es l'assistant nutritionnel ECOLOJIA. 
    Tu aides les utilisateurs   comprendre les analyses de produits et   faire des choix plus sains.
    Sois bienveillant, pedagogue et scientifiquement precis.
    ${context.product ? `Produit en contexte: ${context.product.name}` : ''}`;

    const userPrompt = message;

    return this.analyze(userPrompt, systemPrompt);
  }
}

// Export singleton
module.exports = new DeepSeekService();
