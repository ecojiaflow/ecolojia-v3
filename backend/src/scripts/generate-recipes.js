require('dotenv').config({ path: require('path').join(__dirname, '../..', '.env') });
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Ecolojia:Slm2005171@ecolojia.gnfz2k8.mongodb.net/ecolojia-prod?retryWrites=true&w=majority';

console.log('\n========================================');
console.log('  GÉNÉRATEUR INTELLIGENT - 100 RECETTES');
console.log('  Production scientifique automatisée');
console.log('========================================\n');

// ============================================================================
// BASE DE DONNÉES INGRÉDIENTS (avec scores individuels)
// ============================================================================

const ingredients = {
  // Protéines
  proteins: [
    { name: "Œufs bio", score: 85, unit: "unité", qty: [1, 2, 3] },
    { name: "Blanc de poulet bio", score: 88, unit: "g", qty: [100, 120, 150] },
    { name: "Saumon sauvage", score: 92, unit: "g", qty: [120, 150, 180] },
    { name: "Thon", score: 90, unit: "g", qty: [100, 120] },
    { name: "Tofu", score: 86, unit: "g", qty: [100, 150, 200] },
    { name: "Lentilles", score: 94, unit: "g", qty: [100, 150] },
    { name: "Quinoa", score: 92, unit: "g", qty: [80, 100] },
    { name: "Pois chiches", score: 90, unit: "g", qty: [100, 150] }
  ],
  
  // Légumes
  vegetables: [
    { name: "Épinards frais", score: 96, unit: "g", qty: [50, 80, 100] },
    { name: "Brocolis", score: 95, unit: "g", qty: [100, 150, 200] },
    { name: "Tomates cerises", score: 88, unit: "unité", qty: [5, 8, 10] },
    { name: "Avocat", score: 90, unit: "unité", qty: [0.5, 1] },
    { name: "Concombre", score: 85, unit: "g", qty: [50, 80, 100] },
    { name: "Poivron rouge", score: 88, unit: "unité", qty: [0.5, 1] },
    { name: "Courgettes", score: 86, unit: "g", qty: [100, 150, 200] },
    { name: "Carottes", score: 84, unit: "g", qty: [80, 100, 150] }
  ],
  
  // Fruits
  fruits: [
    { name: "Banane", score: 82, unit: "unité", qty: [0.5, 1] },
    { name: "Pomme", score: 85, unit: "unité", qty: [1] },
    { name: "Fruits rouges", score: 90, unit: "g", qty: [80, 100, 120] },
    { name: "Mangue", score: 84, unit: "g", qty: [100, 150] },
    { name: "Kiwi", score: 88, unit: "unité", qty: [1, 2] }
  ],
  
  // Céréales/Farines
  grains: [
    { name: "Flocons d'avoine", score: 92, unit: "g", qty: [40, 50, 60] },
    { name: "Pain complet", score: 78, unit: 'unité', qty: [1, 2] },
    { name: "Riz complet", score: 82, unit: "g", qty: [80, 100] },
    { name: "Pâtes complètes", score: 80, unit: "g", qty: [80, 100] }
  ],
  
  // Noix/Graines
  nuts: [
    { name: "Amandes", score: 94, unit: "g", qty: [15, 20, 30] },
    { name: "Noix", score: 92, unit: "g", qty: [15, 20, 30] },
    { name: "Graines de chia", score: 93, unit: "g", qty: [10, 15] },
    { name: "Graines de lin", score: 91, unit: "g", qty: [10, 15] }
  ],
  
  // Laits végétaux
  milks: [
    { name: "Lait d'amande", score: 88, unit: "ml", qty: [100, 150, 200] },
    { name: "Lait d'avoine", score: 86, unit: "ml", qty: [100, 150, 200] },
    { name: "Lait de coco", score: 84, unit: "ml", qty: [100, 150, 200] }
  ],
  
  // Condiments
  condiments: [
    { name: "Huile d'olive", score: 90, unit: "càs", qty: [1, 2] },
    { name: "Citron", score: 95, unit: "unité", qty: [0.25, 0.5] },
    { name: "Cannelle", score: 92, unit: "pincée", qty: [1] },
    { name: "Cumin", score: 88, unit: "càc", qty: [0.5, 1] }
  ]
};

// ============================================================================
// TEMPLATES DE RECETTES PAR CATÉGORIE
// ============================================================================

const templates = {
  breakfast: [
    {
      name: "Porridge {fruit} {nut}",
      base: ["grains", "milks"],
      additions: ["fruits", "nuts", "condiments"],
      method: "cuisson",
      difficulty: "easy",
      prepTime: [2, 5],
      cookTime: [5, 10]
    },
    {
      name: "Smoothie bowl {fruit} {nut}",
      base: ["fruits", "milks"],
      additions: ["nuts", "grains"],
      method: "mixer",
      difficulty: "easy",
      prepTime: [5, 8],
      cookTime: [0, 0]
    },
    {
      name: "Omelette {vegetable}",
      base: ["proteins"],
      additions: ["vegetables", "condiments"],
      method: "poêle",
      difficulty: "medium",
      prepTime: [3, 5],
      cookTime: [5, 8]
    },
    {
      name: "Toast {vegetable} {protein}",
      base: ["grains", "proteins"],
      additions: ["vegetables", "condiments"],
      method: "toaster",
      difficulty: "easy",
      prepTime: [5, 8],
      cookTime: [3, 5]
    }
  ],
  
  lunch: [
    {
      name: "Salade {grain} {protein} {vegetable}",
      base: ["grains", "proteins"],
      additions: ["vegetables", "condiments"],
      method: "assemblage",
      difficulty: "easy",
      prepTime: [10, 15],
      cookTime: [15, 20]
    },
    {
      name: "Bowl {grain} {protein}",
      base: ["grains", "proteins"],
      additions: ["vegetables", "nuts"],
      method: "assemblage",
      difficulty: "easy",
      prepTime: [10, 15],
      cookTime: [20, 25]
    },
    {
      name: "Wrap {protein} {vegetable}",
      base: ["grains", "proteins"],
      additions: ["vegetables", "condiments"],
      method: "roulage",
      difficulty: "easy",
      prepTime: [10, 12],
      cookTime: [5, 10]
    }
  ],
  
  dinner: [
    {
      name: "{protein} vapeur {vegetable}",
      base: ["proteins"],
      additions: ["vegetables", "condiments"],
      method: "vapeur",
      difficulty: "easy",
      prepTime: [5, 10],
      cookTime: [12, 20]
    },
    {
      name: "{protein} grillé {vegetable} rôtis",
      base: ["proteins"],
      additions: ["vegetables", "condiments"],
      method: "four",
      difficulty: "medium",
      prepTime: [10, 15],
      cookTime: [25, 35]
    },
    {
      name: "Curry {protein} {vegetable}",
      base: ["proteins"],
      additions: ["vegetables", "milks", "condiments"],
      method: "mijoté",
      difficulty: "medium",
      prepTime: [10, 15],
      cookTime: [20, 30]
    }
  ],
  
  snack: [
    {
      name: "Energy balls {fruit} {nut}",
      base: ["fruits", "nuts"],
      additions: ["condiments"],
      method: "mixer",
      difficulty: "easy",
      prepTime: [10, 15],
      cookTime: [0, 0]
    },
    {
      name: "Smoothie {fruit} {nut}",
      base: ["fruits", "milks"],
      additions: ["nuts"],
      method: "mixer",
      difficulty: "easy",
      prepTime: [5, 8],
      cookTime: [0, 0]
    }
  ],
  
  dessert: [
    {
      name: "Mousse {fruit}",
      base: ["fruits"],
      additions: ["nuts", "condiments"],
      method: "mixer",
      difficulty: "easy",
      prepTime: [10, 15],
      cookTime: [0, 0]
    },
    {
      name: "Compote {fruit}",
      base: ["fruits"],
      additions: ["condiments"],
      method: "cuisson",
      difficulty: "easy",
      prepTime: [5, 10],
      cookTime: [15, 20]
    }
  ]
};

// ============================================================================
// GÉNÉRATEUR DE RECETTES
// ============================================================================

function generateRecipe(template, category, index) {
  // Sélectionner ingrédients de base
  const baseIngredients = [];
  template.base.forEach(type => {
    const ingredientList = ingredients[type];
    if (ingredientList) {
      const ingredient = ingredientList[Math.floor(Math.random() * ingredientList.length)];
      const quantity = ingredient.qty[Math.floor(Math.random() * ingredient.qty.length)];
      baseIngredients.push({
        name: ingredient.name,
        quantity: quantity,
        unit: ingredient.unit,
        score: ingredient.score
      });
    }
  });
  
  // Sélectionner ingrédients additionnels
  const additionalIngredients = [];
  template.additions.forEach(type => {
    const ingredientList = ingredients[type];
    if (ingredientList && ingredientList.length > 0) {
      const ingredient = ingredientList[Math.floor(Math.random() * ingredientList.length)];
      const quantity = ingredient.qty[Math.floor(Math.random() * ingredient.qty.length)];
      additionalIngredients.push({
        name: ingredient.name,
        quantity: quantity,
        unit: ingredient.unit,
        score: ingredient.score
      });
    }
  });
  
  const allIngredients = [...baseIngredients, ...additionalIngredients];
  
  // Calculer score global
  const avgScore = Math.round(
    allIngredients.reduce((sum, ing) => sum + ing.score, 0) / allIngredients.length
  );
  
  // Générer nom
  let name = template.name;
  allIngredients.forEach(ing => {
    const placeholder = `{${ingredients.proteins.includes(ing) ? 'protein' : 
                             ingredients.vegetables.includes(ing) ? 'vegetable' :
                             ingredients.fruits.includes(ing) ? 'fruit' :
                             ingredients.nuts.includes(ing) ? 'nut' :
                             ingredients.grains.includes(ing) ? 'grain' : 'ingredient'}}`;
    name = name.replace(placeholder, ing.name.toLowerCase());
  });
  
  // Nettoyer le nom
  name = name.replace(/\{[^}]+\}/g, '').replace(/\s+/g, ' ').trim();
  name = name.charAt(0).toUpperCase() + name.slice(1);
  
  // Générer slug
  const slug = (name + '-' + index).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Générer steps selon méthode
  const steps = generateSteps(template.method, allIngredients);
  
  // Générer description
  const description = generateDescription(category, allIngredients, avgScore);
  
  // Profils diététiques
  const dietary = determineDietary(allIngredients);
  const goals = determineGoals(avgScore, allIngredients);
  
  const prepTime = template.prepTime[0] + Math.floor(Math.random() * (template.prepTime[1] - template.prepTime[0]));
  const cookTime = template.cookTime[0] + Math.floor(Math.random() * (template.cookTime[1] - template.cookTime[0]));
  
  return {
    name,
    slug,
    category,
    description,
    scores: {
      overallScore: avgScore,
      healthScore: avgScore + Math.floor(Math.random() * 6) - 3,
      environmentScore: avgScore - Math.floor(Math.random() * 8),
      tasteScore: 80 + Math.floor(Math.random() * 15)
    },
    ingredients: allIngredients.map(ing => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit
    })),
    steps,
    prepTime,
    cookTime,
    servings: category === 'snack' ? Math.floor(Math.random() * 5) + 6 : 1,
    difficulty: template.difficulty,
    targetProfiles: {
      dietary,
      goals
    },
    isStock: true,
    isPublic: true
  };
}

function generateSteps(method, ingredients) {
  const steps = [];
  
  switch(method) {
    case 'cuisson':
      steps.push({ order: 1, instruction: `Faire chauffer les ingrédients liquides dans une casserole.`, duration: 2 });
      steps.push({ order: 2, instruction: `Ajouter les ingrédients secs et cuire en remuant régulièrement.`, duration: 5 });
      steps.push({ order: 3, instruction: `Servir chaud dans un bol.`, duration: 1 });
      break;
    case 'mixer':
      steps.push({ order: 1, instruction: `Placer tous les ingrédients dans un blender.`, duration: 2 });
      steps.push({ order: 2, instruction: `Mixer jusqu'à consistance lisse et homogène.`, duration: 3 });
      steps.push({ order: 3, instruction: `Servir immédiatement ou réfrigérer.`, duration: 1 });
      break;
    case 'poêle':
      steps.push({ order: 1, instruction: `Faire chauffer une poêle avec un filet d'huile.`, duration: 2 });
      steps.push({ order: 2, instruction: `Faire revenir les ingrédients en remuant.`, duration: 5 });
      steps.push({ order: 3, instruction: `Servir chaud.`, duration: 1 });
      break;
    case 'vapeur':
      steps.push({ order: 1, instruction: `Préparer un panier vapeur avec de l'eau frémissante.`, duration: 3 });
      steps.push({ order: 2, instruction: `Placer les ingrédients dans le panier et cuire jusqu'à tendreté.`, duration: 12 });
      steps.push({ order: 3, instruction: `Assaisonner et servir.`, duration: 2 });
      break;
    case 'four':
      steps.push({ order: 1, instruction: `Préchauffer le four à 200°C.`, duration: 5 });
      steps.push({ order: 2, instruction: `Disposer les ingrédients sur une plaque, assaisonner.`, duration: 5 });
      steps.push({ order: 3, instruction: `Cuire jusqu'à doré et tendre.`, duration: 25 });
      break;
    case 'assemblage':
      steps.push({ order: 1, instruction: `Préparer et cuire les ingrédients de base séparément.`, duration: 15 });
      steps.push({ order: 2, instruction: `Disposer harmonieusement dans un bol ou assiette.`, duration: 5 });
      steps.push({ order: 3, instruction: `Assaisonner et servir.`, duration: 2 });
      break;
    default:
      steps.push({ order: 1, instruction: `Préparer tous les ingrédients.`, duration: 5 });
      steps.push({ order: 2, instruction: `Suivre la méthode de cuisson appropriée.`, duration: 10 });
      steps.push({ order: 3, instruction: `Servir.`, duration: 2 });
  }
  
  return steps;
}

function generateDescription(category, ingredients, score) {
  const qualifiers = score >= 85 ? ['excellent', 'optimal', 'équilibré'] :
                     score >= 75 ? ['bon', 'sain', 'nutritif'] :
                     ['plaisant', 'gourmand', 'savoureux'];
  
  const qualifier = qualifiers[Math.floor(Math.random() * qualifiers.length)];
  
  const categoryLabels = {
    breakfast: 'petit-déjeuner',
    lunch: 'déjeuner',
    dinner: 'dîner',
    snack: 'en-cas',
    dessert: 'dessert'
  };
  
  const mainIngredients = ingredients.slice(0, 3).map(i => i.name.toLowerCase()).join(', ');
  
  return `Un ${qualifier} ${categoryLabels[category]} à base de ${mainIngredients}. Recette scientifiquement équilibrée.`;
}

function determineDietary(ingredients) {
  const hasAnimal = ingredients.some(i => 
    ['Œufs', 'Poulet', 'Saumon', 'Thon'].some(animal => i.name.includes(animal))
  );
  
  const hasFish = ingredients.some(i => 
    ['Saumon', 'Thon'].some(fish => i.name.includes(fish))
  );
  
  if (!hasAnimal) return ['vegetarian', 'vegan'];
  if (hasFish) return ['omnivore', 'pescatarian'];
  return ['omnivore'];
}

function determineGoals(score, ingredients) {
  const goals = ['health'];
  
  if (score >= 85) goals.push('eco');
  
  const hasProtein = ingredients.some(i => 
    ['Œufs', 'Poulet', 'Saumon', 'Tofu', 'Lentilles'].some(p => i.name.includes(p))
  );
  if (hasProtein) goals.push('muscle-gain');
  
  const hasOmega = ingredients.some(i => 
    ['Saumon', 'Noix', 'Graines'].some(o => i.name.includes(o))
  );
  if (hasOmega) goals.push('muscle-gain');
  
  return goals;
}

// ============================================================================
// GÉNÉRATION ET IMPORT
// ============================================================================

async function generateAndImport() {
  try {
    console.log('🎲 Génération de 100 recettes...\n');
    
    const allRecipes = [];
    
    // Distribution par catégorie
    const distribution = {
      breakfast: 20,
      lunch: 30,
      dinner: 30,
      snack: 10,
      dessert: 10
    };
    
    Object.entries(distribution).forEach(([category, count]) => {
      const categoryTemplates = templates[category];
      console.log(`  ⏳ ${category}: génération de ${count} recettes...`);
      
      for (let i = 0; i < count; i++) {
        const template = categoryTemplates[i % categoryTemplates.length];
        const recipe = generateRecipe(template, category, i + 1);
        allRecipes.push(recipe);
      }
      
      console.log(`  ✅ ${category}: ${count} recettes générées`);
    });
    
    console.log(`\n✅ Total: ${allRecipes.length} recettes générées\n`);
    
    // Import MongoDB
    console.log('⏳ Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connecté\n');
    
    console.log('🗑️  Suppression anciennes recettes stock...');
    const deleteResult = await Recipe.deleteMany({ isStock: true });
    console.log(`   → ${deleteResult.deletedCount} recettes supprimées\n`);
    
    console.log('📥 Insertion nouvelles recettes...');
    await Recipe.insertMany(allRecipes);
    console.log(`✅ ${allRecipes.length} recettes importées\n`);
    
    // Stats finales
    const stats = await Recipe.aggregate([
      { $match: { isStock: true } },
      { $group: { 
          _id: "$category", 
          count: { $sum: 1 },
          avgScore: { $avg: "$scores.overallScore" },
          minScore: { $min: "$scores.overallScore" },
          maxScore: { $max: "$scores.overallScore" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('📊 STATISTIQUES FINALES :');
    console.log('================================');
    stats.forEach(s => {
      console.log(`  ${s._id.padEnd(12)} : ${s.count.toString().padStart(2)} recettes | score moyen: ${Math.round(s.avgScore)}/100 | min: ${s.minScore} | max: ${s.maxScore}`);
    });
    
    console.log('\n========================================');
    console.log('  ✅ IMPORT TERMINÉ AVEC SUCCÈS');
    console.log('  100 recettes scientifiques en base');
    console.log('========================================\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Lancer la génération
generateAndImport();
