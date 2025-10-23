require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const cosmeticsProducts = [
  {
    barcode: '3600523975310',
    name: 'Crème Visage Hydratante',
    brand: 'Nivea',
    category: 'cosmetics',
    imageUrl: 'https://images.openfoodfacts.org/images/products/360/052/397/5310/front_fr.jpg',
    cosmeticsData: {
      inciList: 'Aqua, Glycerin, Cetearyl Alcohol, Dimethicone, Parfum',
      ingredients: [
        { inci: 'Aqua', function: 'Solvant', origin: 'natural' },
        { inci: 'Glycerin', function: 'Hydratant', origin: 'derived' },
        { inci: 'Parfum', function: 'Parfum', origin: 'synthetic', concerns: ['allergen'] }
      ],
      certifications: ['cruelty-free']
    }
  },
  {
    barcode: '3600541005006',
    name: 'Shampooing Doux',
    brand: 'Garnier',
    category: 'cosmetics',
    imageUrl: 'https://via.placeholder.com/150',
    cosmeticsData: {
      inciList: 'Aqua, Sodium Laureth Sulfate, Cocamidopropyl Betaine',
      ingredients: [
        { inci: 'Sodium Laureth Sulfate', function: 'Tensioactif', origin: 'synthetic' }
      ]
    }
  },
  {
    barcode: '3574661323534',
    name: 'Gel Douche Bio',
    brand: 'Cien',
    category: 'cosmetics',
    imageUrl: 'https://via.placeholder.com/150',
    cosmeticsData: {
      inciList: 'Aqua, Aloe Barbadensis Leaf Juice, Coco-Glucoside',
      ingredients: [
        { inci: 'Aloe Barbadensis', function: 'Apaisant', origin: 'natural' }
      ],
      certifications: ['ecocert', 'bio']
    }
  },
  {
    barcode: '3337875583389',
    name: 'Déodorant Spray',
    brand: 'Sanex',
    category: 'cosmetics',
    imageUrl: 'https://via.placeholder.com/150',
    cosmeticsData: {
      inciList: 'Alcohol Denat, Aqua, Aluminum Chlorohydrate',
      ingredients: [
        { inci: 'Aluminum Chlorohydrate', function: 'Anti-transpirant', origin: 'synthetic', concerns: ['aluminum'] }
      ]
    }
  },
  {
    barcode: '3760194624076',
    name: 'Dentifrice Menthe',
    brand: 'Signal',
    category: 'cosmetics',
    imageUrl: 'https://via.placeholder.com/150',
    cosmeticsData: {
      inciList: 'Aqua, Sorbitol, Sodium Fluoride, Menthol',
      ingredients: [
        { inci: 'Sodium Fluoride', function: 'Protection caries', origin: 'synthetic' }
      ]
    }
  }
];

const detergentsProducts = [
  {
    barcode: '4015000961472',
    name: 'Lessive Liquide Ariel',
    brand: 'Ariel',
    category: 'detergents',
    imageUrl: 'https://via.placeholder.com/150',
    detergentsData: {
      composition: ['Tensioactifs anioniques 15-30%', 'Enzymes', 'Parfum'],
      surfactants: ['Sodium Laureth Sulfate', 'Alcohol Ethoxylate'],
      phosphateFree: true,
      biodegradable: true,
      ecoLabels: ['EU Ecolabel']
    }
  },
  {
    barcode: '8410436212342',
    name: 'Liquide Vaisselle Fairy',
    brand: 'Fairy',
    category: 'detergents',
    imageUrl: 'https://via.placeholder.com/150',
    detergentsData: {
      composition: ['Tensioactifs anioniques 5-15%', 'Conservateurs'],
      surfactants: ['Sodium Lauryl Sulfate'],
      phosphateFree: true,
      biodegradable: true
    }
  },
  {
    barcode: '3456780123456',
    name: 'Nettoyant Multi-Surfaces Bio',
    brand: 'Ecover',
    category: 'detergents',
    imageUrl: 'https://via.placeholder.com/150',
    detergentsData: {
      composition: ['Coco-Glucoside', 'Huiles essentielles'],
      surfactants: ['Coco-Glucoside'],
      phosphateFree: true,
      biodegradable: true,
      ecoLabels: ['Ecocert']
    }
  },
  {
    barcode: '5412345678901',
    name: 'Pastilles Lave-Vaisselle',
    brand: 'Finish',
    category: 'detergents',
    imageUrl: 'https://via.placeholder.com/150',
    detergentsData: {
      composition: ['Phosphates', 'Enzymes', 'Agent blanchissant'],
      surfactants: ['Alkyl Polyglucoside'],
      phosphateFree: false,
      biodegradable: false
    }
  },
  {
    barcode: '3234567890123',
    name: 'Adoucissant Lavande',
    brand: 'Lenor',
    category: 'detergents',
    imageUrl: 'https://via.placeholder.com/150',
    detergentsData: {
      composition: ['Tensioactifs cationiques', 'Parfum'],
      surfactants: ['Quaternium-15'],
      phosphateFree: true,
      biodegradable: true
    }
  }
];

async function createProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('? MongoDB connecté');

    // Supprimer produits existants cosmétiques/détergents
    await Product.deleteMany({ category: { $in: ['cosmetics', 'detergents'] } });
    console.log('??? Anciens produits cosmétiques/détergents supprimés');

    // Insérer cosmétiques
    const cosmCreated = await Product.insertMany(cosmeticsProducts);
    console.log(`? ${cosmCreated.length} produits cosmétiques créés`);

    // Insérer détergents
    const detCreated = await Product.insertMany(detergentsProducts);
    console.log(`? ${detCreated.length} produits détergents créés`);

    // Vérifier total
    const totalFood = await Product.countDocuments({ category: 'food' });
    const totalCosm = await Product.countDocuments({ category: 'cosmetics' });
    const totalDet = await Product.countDocuments({ category: 'detergents' });

    console.log('\n?? TOTAL EN BASE:');
    console.log(`  Food: ${totalFood}`);
    console.log(`  Cosmetics: ${totalCosm}`);
    console.log(`  Detergents: ${totalDet}`);
    console.log(`  TOTAL: ${totalFood + totalCosm + totalDet}`);

    process.exit(0);
  } catch (error) {
    console.error('? Erreur:', error);
    process.exit(1);
  }
}

createProducts();
