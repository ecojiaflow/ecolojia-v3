    if (!offData) {
      console.log('[Orchestrator] ⚠️  OFF échoué - Création produit minimal pour enrichissement IA');
      
      // Créer un objet produit minimal (cosmétique par défaut)
      product = {
        barcode,
        name: input.name || 'Produit cosmétique',
        brand: input.brand || '',
        category: 'cosmetics',
        source: 'USER_SCAN',
        cosmeticsData: {
          ingredients: [],
          allergens: [],
          endocrineDisruptors: [],
          certifications: []
        }
      };
      
      console.log('[Orchestrator] ✅ Produit minimal créé, enrichissement IA va suivre');
    } else {
      // Mapper données OFF → format ECOLOJIA
      product = mapOFFToProduct(offData);
    }


