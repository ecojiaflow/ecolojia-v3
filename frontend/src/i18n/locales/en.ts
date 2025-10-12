export const en = {
  common: {
    loading: "Loading...",
    error: "Error",
    ok: "OK",
    cancel: "Cancel",
    search: "Search",
    save: "Save",
    close: "Close",
    back: "Back"
  },
  
  home: {
    title: "Scan your products",
    scanInstant: "Instant scan",
    scanner: "Scanner",
    analyzeInstant: "Analyze instantly",
    searchPlaceholder: "Or search by name",
    stats: {
      products: "Products",
      users: "Users"
    }
  },
  
  nav: {
    home: "Home",
    scanner: "Scanner",
    chatAI: "AI Chat",
    history: "History",
    favorites: "Favorites",
    profile: "Profile"
  },
  
  product: {
    score: {
      overall: "Overall score",
      health: "Health",
      environment: "Environment",
      confidence: "Confidence",
      dataCompleteness: "Data completeness",
      excellent: "Excellent",
      partial: "Partial",
      insufficient: "Insufficient"
    },
    
    breakdown: {
      title: "8-component breakdown (ECOLOJIA V3 methodology)",
      nova: "Processing (NOVA)",
      nutriScore: "Nutritional quality",
      additives: "Additives",
      sugars: "Sugars",
      saturatedFat: "Saturated fat",
      salt: "Salt",
      ecoScore: "Environmental impact",
      labels: "Labels & Ethics",
      weight: "Weight",
      explanation: "Explanation",
      recommendation: "Recommendation",
      measuredValue: "Measured value",
      source: "Source"
    },
    
    actions: {
      analyzeWithAI: "Analyze with AI",
      estimateWithAI: "Estimate with AI",
      viewAlternatives: "View alternatives",
      addToFavorites: "Add to favorites",
      share: "Share"
    },
    
    aiAnalysis: {
      title: "AI Analysis",
      loading: "AI is analyzing the product...",
      missingData: "Missing data",
      estimatedValues: "Estimated values",
      qualitativeAnalysis: "Qualitative analysis",
      confidence: "Estimation confidence",
      estimatedAt: "Estimated on",
      basedOn: "Based on"
    },
    
    disclaimer: {
      title: "Important information",
      scores: "These scores are informative and based on scientific methodologies (WHO, ANSES, EFSA). They do not replace the advice of a health professional.",
      legal: "ECOLOJIA is not a medical device. For personalized nutritional monitoring or in case of pathology (diabetes, allergies, etc.), consult a qualified health professional (doctor, nutritionist, dietitian).",
      aiEstimation: "Some values were estimated by our AI on {{date}}. These values are indicative. Check the product label for confirmation."
    },
    
    confidence: {
      high: "Complete data - Reliable score",
      medium: "Partial data - Indicative score",
      low: "Insufficient data - Score not calculable"
    },
    
    methodology: {
      title: "Scientific methodology",
      components: "8 components weighted by health/environmental impact",
      sources: "Official sources: WHO, ANSES, EFSA, ADEME, Public Health France",
      version: "Version {{version}} - Calculated on {{date}}"
    }
  },
  
  scan: {
    title: "Scan a product",
    instruction: "Point the camera at the barcode",
    analyzing: "Analyzing...",
    notFound: "Product not found",
    error: "Scan error"
  },
  
  chat: {
    title: "AI nutritionist assistant",
    placeholder: "Ask your question...",
    send: "Send",
    disclaimer: "This assistant is an information tool, NOT a health professional.",
    canHelp: "I can help you",
    cannotHelp: "I can NOT",
    examples: {
      explain: "Explain scores",
      suggest: "Suggest alternatives",
      analyze: "Analyze this product"
    }
  }
};
