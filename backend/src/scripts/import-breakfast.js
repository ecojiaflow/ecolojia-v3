require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Ecolojia:Slm2005171@ecolojia.gnfz2k8.mongodb.net/ecolojia-prod?retryWrites=true&w=majority';

console.log('\n========================================');
console.log('  IMPORT BREAKFAST - 20 RECETTES');
console.log('  Expert Nutritionniste | Scientifique');
console.log('========================================\n');

const breakfastRecipes = [
  
  {
    name: "Porridge banane-amande IG bas",
    slug: "porridge-banane-amande-ig-bas",
    category: "breakfast",
    description: "Porridge crémeux aux flocons d'avoine complets, banane et amandes. β-glucanes pour contrôle glycémique (EFSA 2011). IG 45. Satiété 4h+.",
    scores: {
      overallScore: 88,
      healthScore: 92,
      environmentScore: 84,
      tasteScore: 90
    },
    ingredients: [
      { name: "Flocons d'avoine complets", quantity: 50, unit: "g" },
      { name: "Lait d'amande sans sucre", quantity: 200, unit: "ml" },
      { name: "Banane mûre", quantity: 1, unit: "unité" },
      { name: "Amandes effilées", quantity: 15, unit: "g" },
      { name: "Cannelle moulue", quantity: 1, unit: "pincée" },
      { name: "Graines de chia", quantity: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Chauffer le lait d'amande dans une casserole à feu moyen.", duration: 2 },
      { order: 2, instruction: "Ajouter flocons d'avoine et graines de chia. Cuire 5 min en remuant régulièrement.", duration: 5 },
      { order: 3, instruction: "Servir dans un bol avec banane tranchée, amandes effilées et cannelle.", duration: 2 }
    ],
    prepTime: 2,
    cookTime: 5,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian", "vegan"],
      goals: ["health", "glycemic-control", "satiety"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Œufs brouillés épinards-tomates cerises",
    slug: "oeufs-brouilles-epinards-tomates",
    category: "breakfast",
    description: "Œufs bio aux épinards frais et tomates cerises. Protéines complètes 18g. Fer non-hémique + vitamine C pour absorption optimale. Choline pour mémoire.",
    scores: {
      overallScore: 86,
      healthScore: 90,
      environmentScore: 78,
      tasteScore: 88
    },
    ingredients: [
      { name: "Œufs bio plein air", quantity: 2, unit: "unité" },
      { name: "Épinards frais", quantity: 50, unit: "g" },
      { name: "Tomates cerises", quantity: 6, unit: "unité" },
      { name: "Huile d'olive extra vierge", quantity: 1, unit: "c à c" },
      { name: "Sel de mer", quantity: 1, unit: "pincée" },
      { name: "Poivre noir", quantity: 1, unit: "pincée" }
    ],
    steps: [
      { order: 1, instruction: "Battre les œufs dans un bol avec sel et poivre.", duration: 1 },
      { order: 2, instruction: "Faire revenir les épinards lavés et tomates cerises coupées 2 min à feu moyen-vif.", duration: 2 },
      { order: 3, instruction: "Réduire le feu, ajouter œufs battus et cuire en remuant délicatement jusqu'à crémeux.", duration: 3 }
    ],
    prepTime: 3,
    cookTime: 5,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian"],
      goals: ["health", "muscle-gain", "protein"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Smoothie bowl fruits rouges-spiruline",
    slug: "smoothie-bowl-fruits-rouges-spiruline",
    category: "breakfast",
    description: "Bowl smoothie épais aux fruits rouges, spiruline et graines. Anthocyanes puissants (ORAC 4,302). Spiruline 5g = 3g protéines + fer + B12. Texture glace.",
    scores: {
      overallScore: 84,
      healthScore: 88,
      environmentScore: 80,
      tasteScore: 92
    },
    ingredients: [
      { name: "Banane congelée", quantity: 1, unit: "unité" },
      { name: "Fruits rouges surgelés", quantity: 100, unit: "g" },
      { name: "Lait d'avoine", quantity: 100, unit: "ml" },
      { name: "Spiruline en poudre", quantity: 5, unit: "g" },
      { name: "Graines de courge", quantity: 10, unit: "g" },
      { name: "Noix de coco râpée", quantity: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Mixer banane congelée, fruits rouges, lait d'avoine et spiruline jusqu'à consistance très épaisse.", duration: 3 },
      { order: 2, instruction: "Verser dans un bol et décorer avec graines de courge et noix de coco râpée.", duration: 2 }
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["vegetarian", "vegan"],
      goals: ["health", "antioxidants", "energy"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Pancakes protéinés banane-avoine",
    slug: "pancakes-proteines-banane-avoine",
    category: "breakfast",
    description: "Pancakes moelleux sans farine raffinée. Avoine complète + banane + œufs. Sans sucre ajouté, IG 55 vs 85 version classique. Satiété prolongée 4h.",
    scores: {
      overallScore: 82,
      healthScore: 86,
      environmentScore: 78,
      tasteScore: 90
    },
    ingredients: [
      { name: "Flocons d'avoine", quantity: 60, unit: "g" },
      { name: "Banane très mûre", quantity: 1, unit: "unité" },
      { name: "Œufs bio", quantity: 2, unit: "unité" },
      { name: "Lait d'amande", quantity: 50, unit: "ml" },
      { name: "Levure chimique", quantity: 0.5, unit: "c à c" },
      { name: "Huile de coco", quantity: 1, unit: "c à c" }
    ],
    steps: [
      { order: 1, instruction: "Mixer les flocons d'avoine jusqu'à obtenir une farine grossière.", duration: 2 },
      { order: 2, instruction: "Ajouter banane écrasée, œufs, lait d'amande et levure. Mixer jusqu'à homogène.", duration: 3 },
      { order: 3, instruction: "Faire chauffer huile de coco. Verser louches de pâte et cuire 2-3 min par face jusqu'à doré.", duration: 10 }
    ],
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian"],
      goals: ["health", "muscle-gain", "satiety"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Yaourt grec miel-noix-figues",
    slug: "yaourt-grec-miel-noix-figues",
    category: "breakfast",
    description: "Yaourt grec nature avec miel bio, noix et figues séchées. Probiotiques Lactobacillus + oméga-3 ALA + calcium biodisponible. Digestion optimale.",
    scores: {
      overallScore: 80,
      healthScore: 84,
      environmentScore: 74,
      tasteScore: 88
    },
    ingredients: [
      { name: "Yaourt grec nature 0%", quantity: 150, unit: "g" },
      { name: "Miel d'acacia bio", quantity: 1, unit: "c à s" },
      { name: "Cerneaux de noix", quantity: 20, unit: "g" },
      { name: "Figues séchées", quantity: 2, unit: "unité" }
    ],
    steps: [
      { order: 1, instruction: "Verser le yaourt grec dans un bol.", duration: 1 },
      { order: 2, instruction: "Ajouter le miel, les noix concassées grossièrement et les figues coupées en morceaux.", duration: 2 }
    ],
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian"],
      goals: ["health", "protein", "gut-health"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Pain perdu complet cannelle-pomme",
    slug: "pain-perdu-complet-cannelle-pomme",
    category: "breakfast",
    description: "Pain perdu au pain complet, cannelle et compote de pomme maison. IG 60 vs 85 version classique. Cuisson douce pour préserver vitamines. Plaisir équilibré.",
    scores: {
      overallScore: 75,
      healthScore: 78,
      environmentScore: 72,
      tasteScore: 92
    },
    ingredients: [
      { name: "Pain complet rassis", quantity: 2, unit: "tranches" },
      { name: "Œufs bio", quantity: 2, unit: "unité" },
      { name: "Lait d'avoine", quantity: 100, unit: "ml" },
      { name: "Cannelle moulue", quantity: 1, unit: "c à c" },
      { name: "Compote pomme sans sucre", quantity: 50, unit: "g" },
      { name: "Huile de coco", quantity: 1, unit: "c à c" }
    ],
    steps: [
      { order: 1, instruction: "Battre les œufs avec le lait d'avoine et la cannelle.", duration: 2 },
      { order: 2, instruction: "Tremper les tranches de pain dans le mélange 30 secondes par face.", duration: 1 },
      { order: 3, instruction: "Faire dorer dans une poêle avec l'huile de coco 2-3 min par face. Servir avec compote.", duration: 6 }
    ],
    prepTime: 3,
    cookTime: 6,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian"],
      goals: ["health", "pleasure"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Granola maison amandes-cranberries",
    slug: "granola-maison-amandes-cranberries",
    category: "breakfast",
    description: "Granola croustillant fait maison. Flocons avoine, amandes, cranberries. Sans sucre raffiné. Batch-cooking 10 portions. Conservation hermétique 2 semaines.",
    scores: {
      overallScore: 81,
      healthScore: 85,
      environmentScore: 76,
      tasteScore: 88
    },
    ingredients: [
      { name: "Flocons d'avoine", quantity: 300, unit: "g" },
      { name: "Amandes entières", quantity: 100, unit: "g" },
      { name: "Huile de coco fondue", quantity: 3, unit: "c à s" },
      { name: "Sirop d'érable pur", quantity: 3, unit: "c à s" },
      { name: "Cranberries séchées", quantity: 50, unit: "g" },
      { name: "Graines de tournesol", quantity: 30, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Préchauffer four à 160°C. Mélanger flocons, amandes concassées, graines dans saladier.", duration: 5 },
      { order: 2, instruction: "Ajouter huile de coco et sirop d'érable. Bien mélanger pour enrober uniformément.", duration: 3 },
      { order: 3, instruction: "Étaler sur plaque avec papier cuisson. Cuire 25 min en remuant toutes les 10 min.", duration: 25 },
      { order: 4, instruction: "Laisser refroidir complètement, ajouter cranberries. Conserver bocal hermétique.", duration: 30 }
    ],
    prepTime: 8,
    cookTime: 25,
    servings: 10,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian", "vegan"],
      goals: ["health", "batch-cooking"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Tartine avocat-œuf poché-graines",
    slug: "tartine-avocat-oeuf-poche-graines",
    category: "breakfast",
    description: "Tartine complète sur pain aux graines. Avocat écrasé, œuf poché, graines de sésame. Protéines + bonnes graisses + fibres. Satiété 4-5h. IG global 50.",
    scores: {
      overallScore: 85,
      healthScore: 88,
      environmentScore: 80,
      tasteScore: 90
    },
    ingredients: [
      { name: "Pain aux graines complet", quantity: 1, unit: "tranche épaisse" },
      { name: "Avocat mûr", quantity: 0.5, unit: "unité" },
      { name: "Œuf bio", quantity: 1, unit: "unité" },
      { name: "Graines de sésame", quantity: 5, unit: "g" },
      { name: "Citron", quantity: 0.25, unit: "unité" },
      { name: "Sel et poivre", quantity: 1, unit: "pincée" }
    ],
    steps: [
      { order: 1, instruction: "Faire pocher l'œuf dans eau frémissante avec un filet de vinaigre 3-4 min.", duration: 4 },
      { order: 2, instruction: "Toaster le pain. Écraser l'avocat avec jus de citron, sel et poivre.", duration: 3 },
      { order: 3, instruction: "Tartiner l'avocat sur le pain, déposer l'œuf poché, saupoudrer de graines de sésame.", duration: 2 }
    ],
    prepTime: 5,
    cookTime: 4,
    servings: 1,
    difficulty: "medium",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian"],
      goals: ["health", "satiety", "cardiovascular"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Chia pudding coco-mangue",
    slug: "chia-pudding-coco-mangue",
    category: "breakfast",
    description: "Pudding de chia au lait de coco et mangue fraîche. Préparation la veille. Oméga-3 ALA 4g. Antioxydants mangue (vitamine A, C). Gel de chia = satiété.",
    scores: {
      overallScore: 83,
      healthScore: 86,
      environmentScore: 78,
      tasteScore: 90
    },
    ingredients: [
      { name: "Graines de chia", quantity: 30, unit: "g" },
      { name: "Lait de coco", quantity: 250, unit: "ml" },
      { name: "Mangue fraîche", quantity: 100, unit: "g" },
      { name: "Sirop d'agave", quantity: 1, unit: "c à c" },
      { name: "Noix de coco râpée", quantity: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Mélanger graines de chia avec lait de coco et sirop d'agave dans un bocal.", duration: 2 },
      { order: 2, instruction: "Réfrigérer toute la nuit (ou minimum 4h) en remuant après 1h pour éviter grumeaux.", duration: 480 },
      { order: 3, instruction: "Le matin, disposer la mangue coupée en dés et la noix de coco râpée sur le pudding.", duration: 3 }
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["vegetarian", "vegan"],
      goals: ["health", "omega-3", "prep-ahead"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Omelette champignons-épinards-chèvre",
    slug: "omelette-champignons-epinards-chevre",
    category: "breakfast",
    description: "Omelette garnie aux champignons de Paris, épinards et fromage de chèvre frais. Protéines 20g. Vitamine D champignons (exposition UV). Fer végétal biodisponible.",
    scores: {
      overallScore: 84,
      healthScore: 87,
      environmentScore: 79,
      tasteScore: 89
    },
    ingredients: [
      { name: "Œufs bio", quantity: 3, unit: "unité" },
      { name: "Champignons de Paris", quantity: 60, unit: "g" },
      { name: "Épinards frais", quantity: 40, unit: "g" },
      { name: "Fromage de chèvre frais", quantity: 30, unit: "g" },
      { name: "Huile d'olive", quantity: 1, unit: "c à c" },
      { name: "Herbes de Provence", quantity: 1, unit: "pincée" }
    ],
    steps: [
      { order: 1, instruction: "Faire revenir les champignons émincés et les épinards dans l'huile d'olive 3 min.", duration: 3 },
      { order: 2, instruction: "Battre les œufs avec les herbes. Verser dans la poêle, cuire 2 min à feu moyen.", duration: 2 },
      { order: 3, instruction: "Ajouter le fromage de chèvre émietté sur une moitié, plier l'omelette et cuire 1 min.", duration: 1 }
    ],
    prepTime: 5,
    cookTime: 6,
    servings: 1,
    difficulty: "medium",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian"],
      goals: ["health", "protein", "vitamin-d"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Muesli bircher pomme-noisettes",
    slug: "muesli-bircher-pomme-noisettes",
    category: "breakfast",
    description: "Muesli bircher traditionnel suisse. Trempage overnight pour meilleure digestibilité (+40%). Pomme râpée fraîche + noisettes torréfiées. Ferments lactiques naturels.",
    scores: {
      overallScore: 87,
      healthScore: 90,
      environmentScore: 82,
      tasteScore: 86
    },
    ingredients: [
      { name: "Flocons d'avoine", quantity: 50, unit: "g" },
      { name: "Lait d'amande", quantity: 100, unit: "ml" },
      { name: "Yaourt nature", quantity: 50, unit: "g" },
      { name: "Pomme verte", quantity: 1, unit: "unité" },
      { name: "Noisettes torréfiées", quantity: 15, unit: "g" },
      { name: "Miel", quantity: 0.5, unit: "c à c" }
    ],
    steps: [
      { order: 1, instruction: "La veille au soir, mélanger flocons d'avoine avec lait d'amande et yaourt. Réfrigérer.", duration: 480 },
      { order: 2, instruction: "Le matin, râper la pomme et l'ajouter au muesli avec les noisettes concassées et le miel.", duration: 5 }
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian"],
      goals: ["health", "digestion", "prep-ahead"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Shakshuka aux légumes",
    slug: "shakshuka-legumes",
    category: "breakfast",
    description: "Shakshuka méditerranéenne : œufs pochés dans sauce tomate épicée. Poivrons, oignons, cumin. Lycopène + cuisson = biodisponibilité +80%. Cuisine ancestrale.",
    scores: {
      overallScore: 82,
      healthScore: 85,
      environmentScore: 78,
      tasteScore: 90
    },
    ingredients: [
      { name: "Tomates concassées", quantity: 200, unit: "g" },
      { name: "Poivron rouge", quantity: 1, unit: "unité" },
      { name: "Oignon", quantity: 0.5, unit: "unité" },
      { name: "Œufs bio", quantity: 2, unit: "unité" },
      { name: "Cumin moulu", quantity: 0.5, unit: "c à c" },
      { name: "Huile d'olive", quantity: 1, unit: "c à s" }
    ],
    steps: [
      { order: 1, instruction: "Faire revenir l'oignon émincé et le poivron coupé en dés dans l'huile d'olive 5 min.", duration: 5 },
      { order: 2, instruction: "Ajouter les tomates concassées et le cumin. Laisser mijoter 10 min à feu moyen.", duration: 10 },
      { order: 3, instruction: "Creuser 2 puits dans la sauce, casser les œufs. Couvrir et cuire 5-7 min jusqu'à blancs pris.", duration: 7 }
    ],
    prepTime: 5,
    cookTime: 22,
    servings: 1,
    difficulty: "medium",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian"],
      goals: ["health", "mediterranean"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Toast saumon-avocat-aneth",
    slug: "toast-saumon-avocat-aneth",
    category: "breakfast",
    description: "Toast complet au saumon fumé sauvage, avocat et aneth frais. Oméga-3 EPA/DHA 800mg. Vitamine D 10µg. Protéines de qualité. Santé cardiovasculaire + cognitive.",
    scores: {
      overallScore: 84,
      healthScore: 88,
      environmentScore: 76,
      tasteScore: 92
    },
    ingredients: [
      { name: "Pain complet aux graines", quantity: 1, unit: "tranche" },
      { name: "Saumon fumé sauvage", quantity: 40, unit: "g" },
      { name: "Avocat", quantity: 0.5, unit: "unité" },
      { name: "Aneth frais", quantity: 5, unit: "g" },
      { name: "Citron", quantity: 0.25, unit: "unité" },
      { name: "Poivre noir", quantity: 1, unit: "pincée" }
    ],
    steps: [
      { order: 1, instruction: "Toaster le pain jusqu'à doré.", duration: 3 },
      { order: 2, instruction: "Écraser l'avocat avec le jus de citron et le poivre. Tartiner sur le pain.", duration: 2 },
      { order: 3, instruction: "Disposer les tranches de saumon fumé et parsemer d'aneth frais ciselé.", duration: 2 }
    ],
    prepTime: 7,
    cookTime: 3,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "pescatarian"],
      goals: ["health", "omega-3", "brain-health"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Crêpes sarrasin compote myrtilles",
    slug: "crepes-sarrasin-compote-myrtilles",
    category: "breakfast",
    description: "Crêpes de sarrasin sans gluten. Compote de myrtilles maison sans sucre ajouté. Antioxydants anthocyanes. IG 50. Mémoire et vision (études PubMed).",
    scores: {
      overallScore: 79,
      healthScore: 82,
      environmentScore: 76,
      tasteScore: 88
    },
    ingredients: [
      { name: "Farine de sarrasin", quantity: 60, unit: "g" },
      { name: "Lait végétal", quantity: 150, unit: "ml" },
      { name: "Œuf bio", quantity: 1, unit: "unité" },
      { name: "Myrtilles fraîches", quantity: 100, unit: "g" },
      { name: "Huile de coco", quantity: 1, unit: "c à c" }
    ],
    steps: [
      { order: 1, instruction: "Préparer la pâte : mélanger farine, lait végétal et œuf. Laisser reposer 15 min.", duration: 15 },
      { order: 2, instruction: "Faire compoter les myrtilles à feu doux 5 min en écrasant à la fourchette.", duration: 5 },
      { order: 3, instruction: "Cuire les crêpes fines dans la poêle huilée. Servir avec la compote de myrtilles.", duration: 10 }
    ],
    prepTime: 5,
    cookTime: 30,
    servings: 2,
    difficulty: "medium",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian", "gluten-free"],
      goals: ["health", "antioxidants", "brain-health"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Bol quinoa lait amande-fruits secs",
    slug: "bol-quinoa-lait-amande-fruits-secs",
    category: "breakfast",
    description: "Quinoa au lait d'amande façon porridge sucré. Abricots secs, dattes, amandes. Protéines végétales complètes (8 AA essentiels). Fer + magnésium. Alternative vegan porridge.",
    scores: {
      overallScore: 86,
      healthScore: 89,
      environmentScore: 82,
      tasteScore: 85
    },
    ingredients: [
      { name: "Quinoa cru", quantity: 50, unit: "g" },
      { name: "Lait d'amande", quantity: 200, unit: "ml" },
      { name: "Abricots secs", quantity: 3, unit: "unité" },
      { name: "Dattes Medjool", quantity: 2, unit: "unité" },
      { name: "Amandes effilées", quantity: 10, unit: "g" },
      { name: "Cannelle", quantity: 0.5, unit: "c à c" }
    ],
    steps: [
      { order: 1, instruction: "Rincer le quinoa. Cuire dans le lait d'amande avec la cannelle 15 min à feu doux.", duration: 15 },
      { order: 2, instruction: "Hacher les abricots et les dattes. Les ajouter au quinoa cuit et mélanger.", duration: 3 },
      { order: 3, instruction: "Servir chaud avec les amandes effilées grillées à sec.", duration: 2 }
    ],
    prepTime: 5,
    cookTime: 15,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian", "vegan"],
      goals: ["health", "vegan-protein", "satiety"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Cottage cheese fruits rouges-graines lin",
    slug: "cottage-cheese-fruits-rouges-lin",
    category: "breakfast",
    description: "Fromage blanc battu (cottage cheese) avec fruits rouges et graines de lin moulues. Protéines caséine à digestion lente. Oméga-3 ALA. Satiété prolongée. Musculation.",
    scores: {
      overallScore: 85,
      healthScore: 88,
      environmentScore: 80,
      tasteScore: 87
    },
    ingredients: [
      { name: "Cottage cheese 0%", quantity: 150, unit: "g" },
      { name: "Fruits rouges mixtes", quantity: 80, unit: "g" },
      { name: "Graines de lin moulues", quantity: 10, unit: "g" },
      { name: "Miel d'acacia", quantity: 0.5, unit: "c à c" }
    ],
    steps: [
      { order: 1, instruction: "Verser le cottage cheese dans un bol.", duration: 1 },
      { order: 2, instruction: "Ajouter les fruits rouges, les graines de lin moulues et le miel. Mélanger doucement.", duration: 2 }
    ],
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian"],
      goals: ["health", "protein", "muscle-gain"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Bowl acai baies-granola",
    slug: "bowl-acai-baies-granola",
    category: "breakfast",
    description: "Acai bowl épais avec baies fraîches, banane et granola maison. Super-aliment brésilien. Antioxydants ORAC score 102,700. Énergie durable. Instagram-worthy.",
    scores: {
      overallScore: 80,
      healthScore: 83,
      environmentScore: 74,
      tasteScore: 92
    },
    ingredients: [
      { name: "Purée d'acai surgelée", quantity: 100, unit: "g" },
      { name: "Banane congelée", quantity: 1, unit: "unité" },
      { name: "Myrtilles fraîches", quantity: 40, unit: "g" },
      { name: "Granola maison", quantity: 30, unit: "g" },
      { name: "Noix de coco râpée", quantity: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Mixer la purée d'acai avec la banane congelée jusqu'à consistance très épaisse et crémeuse.", duration: 3 },
      { order: 2, instruction: "Verser dans un bol et décorer avec les myrtilles, le granola et la noix de coco.", duration: 2 }
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["vegetarian", "vegan"],
      goals: ["health", "antioxidants", "energy"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Baked oats banane-chocolat",
    slug: "baked-oats-banane-chocolat",
    category: "breakfast",
    description: "Flocons d'avoine cuits au four façon gâteau. Banane, chocolat noir 85%, œuf. Texture moelleuse. Polyphénols cacao. Préparation rapide. Plaisir équilibré IG 58.",
    scores: {
      overallScore: 78,
      healthScore: 81,
      environmentScore: 74,
      tasteScore: 90
    },
    ingredients: [
      { name: "Flocons d'avoine", quantity: 50, unit: "g" },
      { name: "Banane très mûre", quantity: 1, unit: "unité" },
      { name: "Œuf bio", quantity: 1, unit: "unité" },
      { name: "Chocolat noir 85%", quantity: 20, unit: "g" },
      { name: "Levure chimique", quantity: 0.5, unit: "c à c" },
      { name: "Lait végétal", quantity: 50, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Préchauffer four à 180°C. Mixer flocons d'avoine, banane écrasée, œuf, lait végétal et levure.", duration: 3 },
      { order: 2, instruction: "Verser dans un ramequin huilé, ajouter des pépites de chocolat noir sur le dessus.", duration: 2 },
      { order: 3, instruction: "Cuire au four 20 min jusqu'à doré et ferme au centre.", duration: 20 }
    ],
    prepTime: 5,
    cookTime: 20,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "vegetarian"],
      goals: ["pleasure", "energy"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Bagel complet saumon-cream cheese",
    slug: "bagel-complet-saumon-cream-cheese",
    category: "breakfast",
    description: "Bagel complet toasté avec cream cheese allégé, saumon fumé et câpres. Version équilibrée du bagel new-yorkais. Protéines 25g. Oméga-3. Calcium. Complet.",
    scores: {
      overallScore: 81,
      healthScore: 84,
      environmentScore: 75,
      tasteScore: 91
    },
    ingredients: [
      { name: "Bagel complet", quantity: 1, unit: "unité" },
      { name: "Cream cheese 0%", quantity: 40, unit: "g" },
      { name: "Saumon fumé", quantity: 40, unit: "g" },
      { name: "Câpres", quantity: 10, unit: "g" },
      { name: "Oignon rouge", quantity: 2, unit: "rondelles" },
      { name: "Aneth", quantity: 3, unit: "brins" }
    ],
    steps: [
      { order: 1, instruction: "Couper le bagel en deux et le toaster légèrement.", duration: 3 },
      { order: 2, instruction: "Tartiner généreusement chaque moitié avec le cream cheese.", duration: 2 },
      { order: 3, instruction: "Disposer le saumon fumé, les câpres, les rondelles d'oignon et l'aneth. Refermer ou servir ouvert.", duration: 2 }
    ],
    prepTime: 7,
    cookTime: 3,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["omnivore", "pescatarian"],
      goals: ["health", "omega-3", "protein"]
    },
    isStock: true,
    isPublic: true
  },

  {
    name: "Smoothie vert épinards-kiwi-spiruline",
    slug: "smoothie-vert-epinards-kiwi-spiruline",
    category: "breakfast",
    description: "Smoothie détox vert aux épinards, kiwi, pomme verte et spiruline. Chlorophylle + vitamine C + fer végétal. Boost énergie matinal. Alcalinisant. Digestion légère.",
    scores: {
      overallScore: 87,
      healthScore: 91,
      environmentScore: 82,
      tasteScore: 80
    },
    ingredients: [
      { name: "Épinards frais", quantity: 40, unit: "g" },
      { name: "Kiwi", quantity: 1, unit: "unité" },
      { name: "Pomme verte", quantity: 0.5, unit: "unité" },
      { name: "Banane", quantity: 0.5, unit: "unité" },
      { name: "Spiruline en poudre", quantity: 5, unit: "g" },
      { name: "Eau de coco", quantity: 150, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Mixer tous les ingrédients ensemble jusqu'à consistance lisse et homogène.", duration: 3 },
      { order: 2, instruction: "Ajouter de l'eau de coco si le smoothie est trop épais. Servir immédiatement.", duration: 1 }
    ],
    prepTime: 4,
    cookTime: 0,
    servings: 1,
    difficulty: "easy",
    targetProfiles: {
      dietary: ["vegetarian", "vegan"],
      goals: ["health", "detox", "energy", "iron"]
    },
    isStock: true,
    isPublic: true
  }

];

async function importBreakfast() {
  try {
    console.log('⏳ Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connecté\n');
    
    console.log('🗑️  Suppression anciennes recettes breakfast...');
    const deleteResult = await Recipe.deleteMany({ isStock: true, category: 'breakfast' });
    console.log(`   → ${deleteResult.deletedCount} recettes breakfast supprimées\n`);
    
    console.log('📥 Insertion 20 recettes breakfast...');
    await Recipe.insertMany(breakfastRecipes);
    console.log(`✅ ${breakfastRecipes.length} recettes breakfast importées\n`);
    
    const stats = await Recipe.aggregate([
      { $match: { isStock: true, category: 'breakfast' } },
      { 
        $group: { 
          _id: null,
          count: { $sum: 1 },
          avgScore: { $avg: "$scores.overallScore" },
          minScore: { $min: "$scores.overallScore" },
          maxScore: { $max: "$scores.overallScore" }
        }
      }
    ]);
    
    console.log('📊 STATISTIQUES BREAKFAST :');
    console.log('================================');
    if (stats.length > 0) {
      console.log(`  Total : ${stats[0].count} recettes`);
      console.log(`  Score moyen : ${Math.round(stats[0].avgScore)}/100`);
      console.log(`  Score min : ${stats[0].minScore}/100`);
      console.log(`  Score max : ${stats[0].maxScore}/100`);
    }
    
    console.log('\n========================================');
    console.log('  ✅ IMPORT BREAKFAST TERMINÉ');
    console.log('  Batch 1/5 complété avec succès');
    console.log('========================================\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERREUR IMPORT BREAKFAST:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

importBreakfast();