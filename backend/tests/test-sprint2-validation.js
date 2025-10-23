/**
 * TESTS DE VALIDATION SPRINT 2
 * Validation complÃ¨te Nutri-Score + Index GlycÃ©mique
 * VÃ©rification diffÃ©renciation vs concurrence
 */

const FoodScorer = require('./src/scorers/food/foodScorer');
const NutriScorer = require('./src/scorers/food/nutriScorer');
const GlycemicEstimator = require('./src/scorers/food/glycemicEstimator');

class Sprint2ValidationTests {
  constructor() {
    this.foodScorer = new FoodScorer();
    this.nutriScorer = new NutriScorer();
    this.glycemicEstimator = new GlycemicEstimator();
    this.testResults = [];
  }

  /**
   * LANCEMENT COMPLET DES TESTS SPRINT 2
   */
  async runAllTests() {
    console.log('Ã°Å¸Â§Âª ===== TESTS DE VALIDATION SPRINT 2 =====');
    console.log('Ã°Å¸Å½Â¯ Objectif: Valider Nutri-Score + IG + Scoring enrichi\n');

    try {
      // Tests unitaires des nouveaux composants
      await this.testNutriScorer();
      await this.testGlycemicEstimator();
      
      // Tests intÃ©gration scoring enrichi
      await this.testEnhancedScoring();
      
      // Tests diffÃ©renciation concurrentielle
      await this.testCompetitiveDifferentiation();
      
      // Tests cas d'usage rÃ©els
      await this.testRealWorldCases();
      
      // RÃ©sumÃ© final
      this.displayTestSummary();
      
    } catch (error) {
      console.error('Ã¢ÂÅ’ Erreur lors des tests:', error);
      throw error;
    }
  }

  /**
   * TEST 1: NUTRI-SCORER STANDALONE
   */
  async testNutriScorer() {
    console.log('Ã°Å¸Â¥â€” === TEST 1: NUTRI-SCORER ===');
    
    const testCases = [
      {
        name: 'Coca-Cola (exemple ANSES)',
        nutrition: {
          energy_kj: 180,
          saturated_fat: 0,
          sugars: 10.6,
          sodium: 0,
          fiber: 0,
          proteins: 0,
          fruits_vegetables: 0
        },
        expected: { grade: 'B', score_range: [1, 3] } // CORRECTION: B attendu avec ces valeurs
      },
      {
        name: 'Pain complet (exemple ANSES)',
        nutrition: {
          energy_kj: 1000,
          saturated_fat: 1.5,
          sugars: 3,
          sodium: 400,
          fiber: 7,
          proteins: 8,
          fruits_vegetables: 0
        },
        expected: { grade: 'A', score_range: [-3, 0] }
      },
      {
        name: 'Produit ultra-transformÃ©',
        nutrition: {
          energy_kj: 2200,
          saturated_fat: 15,
          sugars: 25,
          sodium: 800,
          fiber: 1,
          proteins: 4,
          fruits_vegetables: 0
        },
        expected: { grade: 'E', score_range: [20, 30] }
      },
      {
        name: 'DonnÃ©es insuffisantes',
        nutrition: {
          energy_kj: 1000
          // Autres donnÃ©es manquantes
        },
        expected: { grade: null, confidence_low: true }
      }
    ];

    for (const testCase of testCases) {
      const result = this.nutriScorer.calculateNutriScore(testCase.nutrition);
      
      let success = true;
      let details = '';
      
      if (testCase.expected.grade === null) {
        success = result.grade === null && result.confidence < 0.4;
        details = `Grade: ${result.grade}, Confiance: ${result.confidence}`;
      } else {
        const scoreInRange = testCase.expected.score_range && 
          result.score >= testCase.expected.score_range[0] && 
          result.score <= testCase.expected.score_range[1];
        
        success = result.grade === testCase.expected.grade && scoreInRange;
        details = `Grade: ${result.grade} (attendu ${testCase.expected.grade}), Score: ${result.score}`;
      }
      
      this.logTestResult('Nutri-Score', testCase.name, success, details);
    }
  }

  /**
   * TEST 2: GLYCEMIC ESTIMATOR STANDALONE  
   */
  async testGlycemicEstimator() {
    console.log('\nÃ°Å¸â€œÅ  === TEST 2: GLYCEMIC ESTIMATOR ===');
    
    const testCases = [
      {
        name: 'Pain blanc',
        data: {
          ingredients: ['farine de blÃ©', 'eau', 'sel'],
          nutrition: { fiber: 2, fat: 3, proteins: 8 }
        },
        expected: { range: [70, 80], category: 'high' }
      },
      {
        name: 'Galettes de riz (ultra-transformÃ©)',
        data: {
          ingredients: ['riz'],
          nutrition: { fiber: 1, fat: 1, proteins: 3 }
        },
        novaData: { group: 4 },
        expected: { range: [85, 95], category: 'high' }
      },
      {
        name: 'Lentilles',
        data: {
          ingredients: ['lentilles vertes'],
          nutrition: { fiber: 8, fat: 1, proteins: 9 }
        },
        expected: { range: [20, 30], category: 'low' }
      },
      {
        name: 'Pomme',
        data: {
          ingredients: ['pomme'],
          nutrition: { fiber: 3, fat: 0.2, proteins: 0.3 }
        },
        expected: { range: [30, 40], category: 'low' }
      },
      {
        name: 'IngrÃ©dients non reconnus',
        data: {
          ingredients: ['xanthan-gum-xyz-123'],
          nutrition: {}
        },
        expected: { index: null, confidence_low: true }
      }
    ];

    for (const testCase of testCases) {
      const result = this.glycemicEstimator.estimateGlycemicIndex(
        testCase.data, 
        testCase.novaData
      );
      
      let success = true;
      let details = '';
      
      if (testCase.expected.index === null) {
        success = result.index === null && result.confidence < 0.4;
        details = `IG: ${result.index}, Confiance: ${result.confidence}`;
      } else {
        const indexInRange = result.index >= testCase.expected.range[0] && 
                           result.index <= testCase.expected.range[1];
        
        success = indexInRange && result.category === testCase.expected.category;
        details = `IG: ${result.index} (attendu ${testCase.expected.range[0]}-${testCase.expected.range[1]}), CatÃ©gorie: ${result.category}`;
      }
      
      this.logTestResult('Index GlycÃ©mique', testCase.name, success, details);
    }
  }

  /**
   * TEST 3: SCORING ENRICHI INTÃƒâ€°GRÃƒâ€°
   */
  async testEnhancedScoring() {
    console.log('\nÃ°Å¸Å¡â‚¬ === TEST 3: SCORING ENRICHI INTÃƒâ€°GRÃƒâ€° ===');
    
    const testCases = [
      {
        name: 'Produit excellent (bio, peu transformÃ©, bon IG)',
        product: {
          name: 'Flocons avoine bio',
          ingredients: ['flocons d\'avoine bio'],
          nutrition: {
            energy_kj: 1500,
            saturated_fat: 1.2,
            sugars: 1,
            sodium: 2,
            fiber: 9,
            proteins: 13,
            fruits_vegetables: 0
          },
          certifications: ['AB', 'bio']
        },
        expected: { score_range: [80, 95], grade: ['A', 'B'] }
      },
      {
        name: 'Produit ultra-transformÃ© dÃ©favorable',
        product: {
          name: 'Galettes riz soufflÃ© industriel',
          ingredients: ['riz', 'sel', 'Ã©mulsifiant E471', 'arÃ´me artificiel'],
          nutrition: {
            energy_kj: 1600,
            saturated_fat: 0.8,
            sugars: 1,
            sodium: 400,
            fiber: 1.5,
            proteins: 8,
            fruits_vegetables: 0
          }
        },
        expected: { score_range: [25, 45], grade: ['D', 'E'] }
      },
      {
        name: 'Produit moyen avec Nutri-Score C',
        product: {
          name: 'PÃ¢tes blanches classiques',
          ingredients: ['semoule de blÃ© dur', 'eau'],
          nutrition: {
            energy_kj: 1500,
            saturated_fat: 0.5,
            sugars: 3,
            sodium: 5,
            fiber: 3,
            proteins: 12,
            fruits_vegetables: 0
          }
        },
        expected: { score_range: [60, 75], grade: ['B', 'C'] }
      }
    ];

    for (const testCase of testCases) {
      const result = await this.foodScorer.analyzeFood(testCase.product);
      
      const scoreInRange = result.score >= testCase.expected.score_range[0] && 
                          result.score <= testCase.expected.score_range[1];
      const gradeValid = testCase.expected.grade.includes(result.grade);
      
      const success = scoreInRange && gradeValid;
      const details = `Score: ${result.score} (attendu ${testCase.expected.score_range[0]}-${testCase.expected.score_range[1]}), Grade: ${result.grade}`;
      
      this.logTestResult('Scoring Enrichi', testCase.name, success, details);
      
      // VÃ©rifications supplÃ©mentaires
      this.validateScoringComponents(testCase.name, result);
    }
  }

  /**
   * TEST 4: DIFFÃƒâ€°RENCIATION CONCURRENTIELLE
   */
  async testCompetitiveDifferentiation() {
    console.log('\nÃ°Å¸Â¥Å  === TEST 4: DIFFÃƒâ€°RENCIATION VS CONCURRENCE ===');
    
    // Produit test: Galettes riz bio (piÃ¨ge ultra-transformation)
    const trapProduct = {
      name: 'Galettes riz bio marque premium',
      ingredients: ['riz bio'],
      nutrition: {
        energy_kj: 1600,
        saturated_fat: 0.8,
        sugars: 1,
        sodium: 300,
        fiber: 1.5,
        proteins: 8,
        fruits_vegetables: 0
      },
      certifications: ['AB']
    };

    const result = await this.foodScorer.analyzeFood(trapProduct);
    
    // Tests diffÃ©renciation
    const tests = [
      {
        name: 'DÃ©tecte ultra-transformation malgrÃ© bio',
        condition: result.breakdown.transformation.details.nova.group >= 4,
        details: `NOVA groupe ${result.breakdown.transformation.details.nova.group}`
      },
      {
        name: 'Index glycÃ©mique Ã©levÃ© dÃ©tectÃ©',
        condition: result.breakdown.glycemic.details.glycemicIndex.index > 80,
        details: `IG ${result.breakdown.glycemic.details.glycemicIndex.index}`
      },
      {
        name: 'Score final pÃ©nalisÃ© malgrÃ© bio',
        condition: result.score < 60,
        details: `Score ${result.score}/100`
      },
      {
        name: 'Recommandations alternatives proposÃ©es',
        condition: result.recommendations.total > 0,
        details: `${result.recommendations.total} recommandations`
      },
      {
        name: 'Sources scientifiques citÃ©es',
        condition: result.meta.sources.length >= 4,
        details: `${result.meta.sources.length} sources officielles`
      }
    ];

    tests.forEach(test => {
      this.logTestResult('DiffÃ©renciation', test.name, test.condition, test.details);
    });

    // Comparaison explicite
    console.log('\nÃ°Å¸â€œÅ  COMPARAISON ECOLOJIA VS CONCURRENCE:');
    console.log(`Ã°Å¸â€ Å¡ Yuka: ${result.differentiation.vs_yuka.concerns_detected}`);
    console.log(`Ã°Å¸â€ Å¡ OpenFoodFacts: ${result.differentiation.vs_openfoodfacts.ecolojia_plus}`);
  }

  /**
   * TEST 5: CAS D'USAGE RÃƒâ€°ELS
   */
  async testRealWorldCases() {
    console.log('\nÃ°Å¸Å’Â === TEST 5: CAS D\'USAGE RÃƒâ€°ELS ===');
    
    const realProducts = [
      {
        name: 'Nutella',
        ingredients: ['sucre', 'huile de palme', 'noisettes', 'cacao maigre', 'lait Ã©crÃ©mÃ© en poudre', 'lactosÃ©rum en poudre', 'Ã©mulsifiants E322', 'vanilline'],
        nutrition: {
          energy_kj: 2252,
          saturated_fat: 10.6,
          sugars: 56.3,
          sodium: 107,
          fiber: 0,
          proteins: 6.3,
          fruits_vegetables: 0
        },
        expected_issues: ['ultra_processing', 'high_sugar', 'poor_nutriscore']
      },
      {
        name: 'Yaourt grec nature bio',
        ingredients: ['lait bio', 'ferments lactiques'],
        nutrition: {
          energy_kj: 500,
          saturated_fat: 4.5,
          sugars: 4,
          sodium: 36,
          fiber: 0,
          proteins: 10,
          fruits_vegetables: 0
        },
        certifications: ['AB'],
        expected_quality: 'high'
      }
    ];

    for (const product of realProducts) {
      const result = await this.foodScorer.analyzeFood(product);
      
      console.log(`\nÃ°Å¸â€œÂ¦ ${product.name}:`);
      console.log(`   Score: ${result.score}/100 (${result.grade})`);
      console.log(`   Confiance: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`   PrÃ©occupations: ${result.insights.total_concerns}`);
      
      if (result.breakdown.nutrition.details.nutriScore.grade) {
        console.log(`   Nutri-Score: ${result.breakdown.nutrition.details.nutriScore.grade}`);
      }
      
      if (result.breakdown.glycemic.details.glycemicIndex.index) {
        console.log(`   Index GlycÃ©mique: ${result.breakdown.glycemic.details.glycemicIndex.index}`);
      }
      
      console.log(`   NOVA: Groupe ${result.breakdown.transformation.details.nova.group}`);
      console.log(`   AmÃ©lioration: ${result.improvement}`);
      
      // Validation des attentes
      if (product.expected_quality === 'high') {
        const success = result.score >= 70;
        this.logTestResult('Cas RÃ©el', `${product.name} - QualitÃ© attendue`, success, `Score ${result.score}`);
      }
      
      if (product.expected_issues) {
        const hasExpectedIssues = product.expected_issues.some(issue => 
          result.insights.items.some(insight => insight.type.includes(issue))
        );
        this.logTestResult('Cas RÃ©el', `${product.name} - ProblÃ¨mes dÃ©tectÃ©s`, hasExpectedIssues, `Issues trouvÃ©es`);
      }
    }
  }

  /**
   * VALIDATION DES COMPOSANTS DU SCORING
   */
  validateScoringComponents(productName, result) {
    const components = result.breakdown;
    
    // VÃ©rification poids
    const totalWeight = Object.values(this.foodScorer.weights).reduce((sum, w) => sum + w, 0);
    const weightValid = Math.abs(totalWeight - 1.0) < 0.01;
    
    console.log(`     Ã°Å¸â€œÅ  Poids total: ${totalWeight.toFixed(2)} ${weightValid ? 'Ã¢Å“â€¦' : 'Ã¢ÂÅ’'}`);
    
    // VÃ©rification composants
    ['transformation', 'nutrition', 'glycemic', 'environmental'].forEach(component => {
      const hasData = components[component] && components[component].score !== undefined;
      console.log(`     Ã°Å¸â€Â ${component}: ${hasData ? 'Ã¢Å“â€¦' : 'Ã¢ÂÅ’'} Score ${components[component]?.score || 'N/A'}`);
    });
    
    // VÃ©rification confiance globale
    const confidenceValid = result.confidence >= 0 && result.confidence <= 1;
    console.log(`     Ã°Å¸Å½Â¯ Confiance globale: ${(result.confidence * 100).toFixed(0)}% ${confidenceValid ? 'Ã¢Å“â€¦' : 'Ã¢ÂÅ’'}`);
  }

  /**
   * LOGGING DES RÃƒâ€°SULTATS
   */
  logTestResult(category, testName, success, details) {
    const status = success ? 'Ã¢Å“â€¦' : 'Ã¢ÂÅ’';
    console.log(`   ${status} ${testName}: ${details}`);
    
    this.testResults.push({
      category,
      test: testName,
      success,
      details
    });
  }

  /**
   * RÃƒâ€°SUMÃƒâ€° FINAL DES TESTS
   */
  displayTestSummary() {
    console.log('\nÃ°Å¸Å½Â¯ ===== RÃƒâ€°SUMÃƒâ€° TESTS SPRINT 2 =====');
    
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const successRate = ((successfulTests / totalTests) * 100).toFixed(1);
    
    console.log(`Ã°Å¸â€œÅ  Tests rÃ©alisÃ©s: ${totalTests}`);
    console.log(`Ã¢Å“â€¦ Tests rÃ©ussis: ${successfulTests}`);
    console.log(`Ã¢ÂÅ’ Tests Ã©chouÃ©s: ${totalTests - successfulTests}`);
    console.log(`Ã°Å¸Å½Â¯ Taux de rÃ©ussite: ${successRate}%`);
    
    // DÃ©tail par catÃ©gorie
    const categories = [...new Set(this.testResults.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryTests = this.testResults.filter(r => r.category === category);
      const categorySuccess = categoryTests.filter(r => r.success).length;
      console.log(`\nÃ°Å¸â€œâ€¹ ${category}: ${categorySuccess}/${categoryTests.length} rÃ©ussis`);
      
      // Afficher les Ã©checs
      const failures = categoryTests.filter(r => !r.success);
      failures.forEach(failure => {
        console.log(`   Ã¢ÂÅ’ ${failure.test}: ${failure.details}`);
      });
    });
    
    // Validation Sprint 2
    const sprintSuccess = successRate >= 85; // 85% minimum requis
    
    console.log(`\nÃ°Å¸Å¡â‚¬ SPRINT 2 VALIDATION: ${sprintSuccess ? 'Ã¢Å“â€¦ RÃƒâ€°USSI' : 'Ã¢ÂÅ’ Ãƒâ€°CHEC'}`);
    
    if (sprintSuccess) {
      console.log('Ã°Å¸Å½â€° Nutri-Score + Index GlycÃ©mique opÃ©rationnels !');
      console.log('Ã°Å¸Å½Â¯ PrÃªt pour SPRINT 3: Alternatives Naturelles');
    } else {
      console.log('Ã¢Å¡Â Ã¯Â¸Â Corrections nÃ©cessaires avant passage Sprint 3');
    }
    
    return sprintSuccess;
  }
}

// EXÃƒâ€°CUTION DES TESTS
async function runSprint2Tests() {
  const validator = new Sprint2ValidationTests();
  
  try {
    const success = await validator.runAllTests();
    
    if (success) {
      console.log('\nÃ¢Å“â€¦ SPRINT 2 VALIDÃƒâ€° - PrÃªt pour la suite !');
      process.exit(0);
    } else {
      console.log('\nÃ¢ÂÅ’ SPRINT 2 INCOMPLET - VÃ©rifications requises');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\nÃ°Å¸â€™Â¥ ERREUR CRITIQUE lors des tests:', error);
    process.exit(1);
  }
}

// Export pour usage en module ou exÃ©cution directe
if (require.main === module) {
  runSprint2Tests();
}

module.exports = Sprint2ValidationTests;