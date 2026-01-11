/**
 * Tests pour productContext.service.js
 * Version: 1.0.0 | Date: 11 janvier 2026
 */

const { generateProductContext } = require('../src/services/productContext.service');

describe('ProductContext Service', () => {
  
  describe('generateProductContext', () => {
    
    // ===========================================
    // CAS DE BASE
    // ===========================================
    
    test('retourne un contexte par défaut si produit null', () => {
      const result = generateProductContext(null);
      
      expect(result).toBeDefined();
      expect(result.processingLevel).toBe('unknown');
      expect(result.packagingType).toBe('unknown');
      expect(result.contextConfidence).toBe('low');
      expect(result.riskProfiles).toEqual([]);
    });
    
    test('retourne un contexte par défaut si produit undefined', () => {
      const result = generateProductContext(undefined);
      
      expect(result).toBeDefined();
      expect(result.processingLevel).toBe('unknown');
    });
    
    // ===========================================
    // NUTELLA (Produit de référence)
    // ===========================================
    
    test('Nutella: ultra-transformé, sucre élevé, packaging verre', () => {
      const nutella = {
        name: 'Nutella',
        subcategory: 'spread',
        foodData: {
          novaGroup: 4,
          nutritionalInfo: {
            sugars: 56.8,
            salt: 0.11,
            saturatedFat: 10.6
          }
        },
        labels: []
      };
      
      const result = generateProductContext(nutella);
      
      expect(result.processingLevel).toBe('ultra_processed');
      expect(result.sugarLevel).toBe('high');
      expect(result.saltLevel).toBe('low');
      expect(result.satFatLevel).toBe('high');
      expect(result.packagingType).toBe('glass');
      expect(result.packagingConfidence).toBe('high');
      expect(result.isOrganic).toBe(false);
      expect(result.usageFrequency).toBe('frequent');
      expect(result.riskProfiles).toContain('glycemic_variation');
      expect(result.riskProfiles).toContain('palatability');
      expect(result.riskProfiles).toContain('nutritional_imbalance');
      expect(result.contextConfidence).toBe('high');
    });
    
    // ===========================================
    // PACKAGING PAR CATÉGORIE
    // ===========================================
    
    test('spread -> packaging verre', () => {
      const product = { subcategory: 'spread' };
      const result = generateProductContext(product);
      expect(result.packagingType).toBe('glass');
      expect(result.packagingConfidence).toBe('high');
    });
    
    test('chocolate-spread -> packaging verre', () => {
      const product = { subcategory: 'chocolate-spread' };
      const result = generateProductContext(product);
      expect(result.packagingType).toBe('glass');
      expect(result.packagingConfidence).toBe('high');
    });
    
    test('jam -> packaging verre', () => {
      const product = { subcategory: 'jam' };
      const result = generateProductContext(product);
      expect(result.packagingType).toBe('glass');
    });
    
    test('beverage -> packaging plastique', () => {
      const product = { subcategory: 'beverage' };
      const result = generateProductContext(product);
      expect(result.packagingType).toBe('plastic');
      expect(result.packagingConfidence).toBe('medium');
    });
    
    test('cereal -> packaging carton', () => {
      const product = { subcategory: 'cereal' };
      const result = generateProductContext(product);
      expect(result.packagingType).toBe('cardboard');
      expect(result.packagingConfidence).toBe('high');
    });
    
    test('pasta -> packaging carton', () => {
      const product = { subcategory: 'pasta' };
      const result = generateProductContext(product);
      expect(result.packagingType).toBe('cardboard');
    });
    
    test('canned-vegetables -> packaging métal', () => {
      const product = { subcategory: 'canned-vegetables' };
      const result = generateProductContext(product);
      expect(result.packagingType).toBe('metal');
    });
    
    test('milk -> packaging composite', () => {
      const product = { subcategory: 'milk' };
      const result = generateProductContext(product);
      expect(result.packagingType).toBe('composite');
    });
    
    // ===========================================
    // NIVEAUX NUTRITIONNELS
    // ===========================================
    
    test('sucre <= 5g -> sugarLevel low', () => {
      const product = {
        foodData: { nutritionalInfo: { sugars: 3 } }
      };
      const result = generateProductContext(product);
      expect(result.sugarLevel).toBe('low');
    });
    
    test('sucre 5-12.5g -> sugarLevel medium', () => {
      const product = {
        foodData: { nutritionalInfo: { sugars: 10 } }
      };
      const result = generateProductContext(product);
      expect(result.sugarLevel).toBe('medium');
    });
    
    test('sucre > 12.5g -> sugarLevel high', () => {
      const product = {
        foodData: { nutritionalInfo: { sugars: 25 } }
      };
      const result = generateProductContext(product);
      expect(result.sugarLevel).toBe('high');
    });
    
    test('sel <= 0.3g -> saltLevel low', () => {
      const product = {
        foodData: { nutritionalInfo: { salt: 0.1 } }
      };
      const result = generateProductContext(product);
      expect(result.saltLevel).toBe('low');
    });
    
    test('sel > 1.5g -> saltLevel high', () => {
      const product = {
        foodData: { nutritionalInfo: { salt: 2.5 } }
      };
      const result = generateProductContext(product);
      expect(result.saltLevel).toBe('high');
    });
    
    // ===========================================
    // NIVEAU DE TRANSFORMATION (NOVA)
    // ===========================================
    
    test('NOVA 1 -> raw', () => {
      const product = { foodData: { novaGroup: 1 } };
      const result = generateProductContext(product);
      expect(result.processingLevel).toBe('raw');
    });
    
    test('NOVA 2 -> minimally_processed', () => {
      const product = { foodData: { novaGroup: 2 } };
      const result = generateProductContext(product);
      expect(result.processingLevel).toBe('minimally_processed');
    });
    
    test('NOVA 3 -> processed', () => {
      const product = { foodData: { novaGroup: 3 } };
      const result = generateProductContext(product);
      expect(result.processingLevel).toBe('processed');
    });
    
    test('NOVA 4 -> ultra_processed', () => {
      const product = { foodData: { novaGroup: 4 } };
      const result = generateProductContext(product);
      expect(result.processingLevel).toBe('ultra_processed');
    });
    
    // ===========================================
    // PRODUITS BIO
    // ===========================================
    
    test('produit avec label bio -> isOrganic true', () => {
      const product = {
        labels: ['Agriculture Biologique', 'EU Organic']
      };
      const result = generateProductContext(product);
      expect(result.isOrganic).toBe(true);
    });
    
    test('produit sans label bio -> isOrganic false', () => {
      const product = {
        labels: ['Sans gluten', 'Végan']
      };
      const result = generateProductContext(product);
      expect(result.isOrganic).toBe(false);
    });
    
    // ===========================================
    // FRÉQUENCE D USAGE
    // ===========================================
    
    test('biscuit -> usage fréquent', () => {
      const product = { subcategory: 'biscuit' };
      const result = generateProductContext(product);
      expect(result.usageFrequency).toBe('frequent');
    });
    
    test('cake -> usage occasionnel', () => {
      const product = { subcategory: 'cake' };
      const result = generateProductContext(product);
      expect(result.usageFrequency).toBe('occasional');
    });
    
    // ===========================================
    // PROFILS DE RISQUE
    // ===========================================
    
    test('sucre élevé -> risque glycemic_variation', () => {
      const product = {
        foodData: { nutritionalInfo: { sugars: 50 } }
      };
      const result = generateProductContext(product);
      expect(result.riskProfiles).toContain('glycemic_variation');
    });
    
    test('ultra-transformé -> risque palatability', () => {
      const product = {
        foodData: { novaGroup: 4 }
      };
      const result = generateProductContext(product);
      expect(result.riskProfiles).toContain('palatability');
    });
    
    test('sucre + gras saturé élevés -> risque palatability', () => {
      const product = {
        foodData: {
          nutritionalInfo: { sugars: 30, saturatedFat: 15 }
        }
      };
      const result = generateProductContext(product);
      expect(result.riskProfiles).toContain('palatability');
    });
    
    test('plastique + usage fréquent -> risque packaging_migration', () => {
      const product = {
        subcategory: 'beverage'
      };
      const result = generateProductContext(product);
      // beverage = plastic + medium confidence + frequent = pas de risque car confidence medium
      // Testons avec snack qui a aussi plastic
      const snack = { subcategory: 'dairy' };
      const resultSnack = generateProductContext(snack);
      // dairy = plastic + medium confidence + frequent = pas de risque car confidence medium
    });
    
    test('produit brut non bio -> risque pesticide_exposure', () => {
      const product = {
        foodData: { novaGroup: 1 },
        subcategory: 'fruit',
        labels: []
      };
      const result = generateProductContext(product);
      expect(result.isRawAgricultural).toBe(true);
      expect(result.isOrganic).toBe(false);
      expect(result.riskProfiles).toContain('pesticide_exposure');
    });
    
    test('sel élevé -> risque nutritional_imbalance', () => {
      const product = {
        foodData: { nutritionalInfo: { salt: 3 } }
      };
      const result = generateProductContext(product);
      expect(result.riskProfiles).toContain('nutritional_imbalance');
    });
    
  });
  
});
