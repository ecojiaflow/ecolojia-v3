// backend/scripts/fix-subcategories.js
// Script de correction des subcategories mal assignées
// Version 1.0 - Dry run d'abord, puis exécution réelle

const mongoose = require('mongoose');
require('dotenv').config();

// Mapping de détection → nouvelle subcategory
const CATEGORY_RULES = [
  // Vrais spreads (pâtes à tartiner)
  {
    subcategory: 'spread',
    namePatterns: [/tartiner/i, /pindakaas/i, /peanut\s*butter/i, /beurre.*cacahu/i, /puree.*amande/i, /puree.*noisette/i, /almond\s*butter/i, /hazelnut\s*spread/i, /chocolate\s*spread/i, /tahini/i, /speculoos.*spread/i, /biscoff.*spread/i],
    ingredientPatterns: [/pâte.*tartiner/i, /spread/i]
  },
  // Biscuits
  {
    subcategory: 'biscuit',
    namePatterns: [/biscuit/i, /cookie/i, /sablé/i, /petit.*beurre/i, /galette/i, /spéculoos/i, /belvita/i, /tuc/i, /digestive/i, /oreo/i, /prince/i, /bn\b/i, /palmier/i, /cigarette/i, /tuile/i, /henry'?s/i, /bimo/i, /tonik/i, /tagger/i, /spofy/i, /merendina/i, /biscotti/i],
    ingredientPatterns: [/farine.*sucre.*huile/i, /biscuit/i]
  },
  // Chocolat (tablettes, barres)
  {
    subcategory: 'chocolate',
    namePatterns: [/chocolat/i, /chocolate/i, /toblerone/i, /lindt/i, /côte.*d'?or/i, /milka/i, /kinder/i, /ferrero/i, /raffaello/i, /praline/i, /truffe/i, /rocher/i, /noir\s*extra/i, /edelbitter/i, /bitter.*mild/i],
    ingredientPatterns: [/pâte.*cacao.*beurre.*cacao/i, /chocolat.*lait/i]
  },
  // Chips & snacks salés
  {
    subcategory: 'chips',
    namePatterns: [/chips/i, /crisps/i, /lay'?s/i, /pringles/i, /doritos/i, /cheetos/i, /curly/i, /monster\s*munch/i, /cuites.*four/i],
    ingredientPatterns: [/pommes.*terre.*huile/i, /flocons.*pommes.*terre/i]
  },
  // Gâteaux
  {
    subcategory: 'cake',
    namePatterns: [/gâteau/i, /cake/i, /muffin/i, /napolitain/i, /madeleine/i, /brownie/i, /fondant/i, /moelleux/i, /quatre.*quart/i, /génoise/i],
    ingredientPatterns: [/farine.*œuf.*sucre/i, /farine.*oeuf.*sucre/i]
  },
  // Crackers
  {
    subcategory: 'cracker',
    namePatterns: [/cracker/i, /crispbread/i, /tartine.*craquante/i, /pain.*grillé/i, /ryvita/i, /wasa/i, /krisprolls/i, /biscottes/i],
    ingredientPatterns: [/farine.*sarrasin/i, /rye.*flour/i, /pain.*complet/i]
  },
  // Céréales petit-déjeuner
  {
    subcategory: 'cereal',
    namePatterns: [/céréale/i, /cereal/i, /muesli/i, /müsli/i, /granola/i, /flocon/i, /oat/i, /corn\s*flakes/i, /special\s*k/i, /chocapic/i, /nesquik/i, /lion/i, /cheerios/i, /porridge/i, /haferflocken/i],
    ingredientPatterns: [/flocons.*avoine/i, /céréales.*complètes/i]
  },
  // Confiture
  {
    subcategory: 'jam',
    namePatterns: [/confiture/i, /marmelade/i, /gelée/i, /jam\b/i, /jelly/i, /compote/i],
    ingredientPatterns: [/fruits.*sucre.*pectine/i]
  },
  // Barres énergétiques/snacks
  {
    subcategory: 'snack_bar',
    namePatterns: [/barre/i, /bar\b/i, /nakd/i, /cliff/i, /nature.*valley/i, /grany/i, /twix/i, /mars\b/i, /snickers/i, /bounty/i, /kit\s*kat/i],
    ingredientPatterns: [/dates.*raisins.*noix/i, /céréales.*chocolat/i]
  }
];

// Fonction de détection de catégorie
function detectCategory(product) {
  const name = (product.name || '').toLowerCase();
  const ingredients = (product.ingredients_text || '').toLowerCase();
  
  for (const rule of CATEGORY_RULES) {
    // Vérifier les patterns de nom
    for (const pattern of rule.namePatterns) {
      if (pattern.test(name)) {
        return { subcategory: rule.subcategory, reason: `name: ${pattern}` };
      }
    }
    // Vérifier les patterns d'ingrédients
    for (const pattern of rule.ingredientPatterns) {
      if (pattern.test(ingredients)) {
        return { subcategory: rule.subcategory, reason: `ingredients: ${pattern}` };
      }
    }
  }
  
  return { subcategory: 'other', reason: 'no match' };
}

async function fixSubcategories(dryRun = true) {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.connection.collection('products');
  
  console.log(`\n=== CORRECTION SUBCATEGORIES (${dryRun ? 'DRY RUN' : 'EXÉCUTION RÉELLE'}) ===\n`);
  
  // Récupérer tous les produits "spread" actuels
  const spreads = await Product.find({ subcategory: 'spread' })
    .project({ _id: 1, name: 1, barcode: 1, ingredients_text: 1, subcategory: 1 })
    .toArray();
  
  console.log(`Total produits à analyser: ${spreads.length}\n`);
  
  // Statistiques
  const stats = {};
  const corrections = [];
  
  for (const product of spreads) {
    const detection = detectCategory(product);
    
    if (!stats[detection.subcategory]) {
      stats[detection.subcategory] = { count: 0, examples: [] };
    }
    stats[detection.subcategory].count++;
    
    if (stats[detection.subcategory].examples.length < 3) {
      stats[detection.subcategory].examples.push(product.name);
    }
    
    // Si différent de "spread", c'est une correction
    if (detection.subcategory !== 'spread') {
      corrections.push({
        _id: product._id,
        name: product.name,
        oldSubcategory: 'spread',
        newSubcategory: detection.subcategory,
        reason: detection.reason
      });
    }
  }
  
  // Afficher statistiques
  console.log('RÉSULTAT DE LA DÉTECTION:');
  console.log('─'.repeat(50));
  
  for (const [subcat, data] of Object.entries(stats).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`\n${subcat.toUpperCase()}: ${data.count} produits`);
    data.examples.forEach(ex => console.log(`  - ${ex}`));
  }
  
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`CORRECTIONS À EFFECTUER: ${corrections.length} produits`);
  console.log(`VRAIS SPREADS (inchangés): ${stats['spread']?.count || 0} produits`);
  
  // Exécuter les corrections si pas dry run
  if (!dryRun && corrections.length > 0) {
    console.log('\nApplication des corrections...');
    
    let updated = 0;
    for (const corr of corrections) {
      await Product.updateOne(
        { _id: corr._id },
        { $set: { subcategory: corr.newSubcategory } }
      );
      updated++;
      
      if (updated % 1000 === 0) {
        console.log(`  ${updated}/${corrections.length} corrigés...`);
      }
    }
    
    console.log(`\n✅ ${updated} produits corrigés avec succès!`);
  } else if (dryRun) {
    console.log('\n⚠️  Mode DRY RUN - Aucune modification effectuée');
    console.log('Pour exécuter réellement, relancez avec: node scripts/fix-subcategories.js --execute');
  }
  
  await mongoose.connection.close();
}

// Vérifier les arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

fixSubcategories(dryRun).catch(console.error);
