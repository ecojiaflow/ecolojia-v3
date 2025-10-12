export const fr = {
  common: {
    loading: "Chargement...",
    error: "Erreur",
    ok: "OK",
    cancel: "Annuler",
    search: "Rechercher",
    save: "Enregistrer",
    close: "Fermer",
    back: "Retour"
  },
  
  home: {
    title: "Scannez vos produits",
    scanInstant: "Scanner instantané",
    scanner: "Scanner",
    analyzeInstant: "Analysez instantanément",
    searchPlaceholder: "Ou rechercher par nom",
    stats: {
      products: "Produits",
      users: "Utilisateurs"
    }
  },
  
  nav: {
    home: "Accueil",
    scanner: "Scanner",
    chatAI: "Chat IA",
    history: "Historique",
    favorites: "Favoris",
    profile: "Profil"
  },
  
  product: {
    score: {
      overall: "Score global",
      health: "Santé",
      environment: "Environnement",
      confidence: "Confiance",
      dataCompleteness: "Complétude des données",
      excellent: "Excellente",
      partial: "Partielle",
      insufficient: "Insuffisante"
    },
    
    breakdown: {
      title: "Détail des 8 composantes (méthodologie ECOLOJIA V3)",
      nova: "Transformation (NOVA)",
      nutriScore: "Qualité nutritionnelle",
      additives: "Additifs",
      sugars: "Sucres",
      saturatedFat: "Graisses saturées",
      salt: "Sel",
      ecoScore: "Impact environnemental",
      labels: "Labels & Éthique",
      weight: "Poids",
      explanation: "Explication",
      recommendation: "Recommandation",
      measuredValue: "Valeur mesurée",
      source: "Source"
    },
    
    actions: {
      analyzeWithAI: "Analyser avec l'IA",
      estimateWithAI: "Estimer avec l'IA",
      viewAlternatives: "Voir les alternatives",
      addToFavorites: "Ajouter aux favoris",
      share: "Partager"
    },
    
    aiAnalysis: {
      title: "Analyse IA",
      loading: "L'IA analyse le produit...",
      missingData: "Données manquantes",
      estimatedValues: "Valeurs estimées",
      qualitativeAnalysis: "Analyse qualitative",
      confidence: "Confiance de l'estimation",
      estimatedAt: "Estimé le",
      basedOn: "Basé sur"
    },
    
    disclaimer: {
      title: "Information importante",
      scores: "Ces scores sont informatifs et basés sur des méthodologies scientifiques (OMS, ANSES, EFSA). Ils ne remplacent pas l'avis d'un professionnel de santé.",
      legal: "ECOLOJIA n'est pas un dispositif médical. Pour un suivi nutritionnel personnalisé ou en cas de pathologie (diabète, allergies, etc.), consultez un professionnel de santé diplômé (médecin, nutritionniste, diététicien).",
      aiEstimation: "Certaines valeurs ont été estimées par notre IA le {{date}}. Ces valeurs sont indicatives. Vérifiez l'étiquette du produit pour confirmation."
    },
    
    confidence: {
      high: "Données complètes - Score fiable",
      medium: "Données partielles - Score indicatif",
      low: "Données insuffisantes - Score non calculable"
    },
    
    methodology: {
      title: "Méthodologie scientifique",
      components: "8 composantes pondérées selon leur impact santé/environnement",
      sources: "Sources officielles : OMS, ANSES, EFSA, ADEME, Santé Publique France",
      version: "Version {{version}} - Calculé le {{date}}"
    }
  },
  
  scan: {
    title: "Scanner un produit",
    instruction: "Pointez la caméra vers le code-barre",
    analyzing: "Analyse en cours...",
    notFound: "Produit non trouvé",
    error: "Erreur lors du scan"
  },
  
  chat: {
    title: "Assistant nutritionniste IA",
    placeholder: "Posez votre question...",
    send: "Envoyer",
    disclaimer: "Cet assistant est un outil d'information, PAS un professionnel de santé.",
    canHelp: "Je peux vous aider à",
    cannotHelp: "Je ne peux PAS",
    examples: {
      explain: "Expliquer les scores",
      suggest: "Suggérer des alternatives",
      analyze: "Analyser ce produit"
    }
  }
};
