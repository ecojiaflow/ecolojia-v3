# 🌿 ECOLOJIA V3.1 - PACKAGE COMPLET HANDOVER
**Date** : 4 Novembre 2025, 19h30
**Expert** : Lead Senior 15+ ans
**Statut** : MVP 95% - Enrichissement cosmétiques ✅ / Alimentaire à corriger
**Encodage** : UTF-8 sans BOM garanti

---

# 📊 BACKEND STRUCTURE SCAN

## Routes (50 fichiers)
- ai.routes.js (146 lignes)
- algolia-unified.js (278 lignes)
- alternatives.routes.js (210 lignes)
- analysis-simple.js (30 lignes)
- analysis.routes.js (78 lignes)
- analyze.routes.js (48 lignes)
- auth.google.js (75 lignes)
- auth.js (292 lignes)
- auth.routes.js (570 lignes)
- auth.simple.js (94 lignes)
- chat.routes.js (96 lignes)
- cosmetics.routes.js (30 lignes)
- dashboard.js (146 lignes)
- debug.routes.js (16 lignes)
- detergents.routes.js (29 lignes)
- enrich.routes.js (146 lignes)
- export.js (440 lignes)
- favorites.js (115 lignes)
- favorites.routes.js (41 lignes)
- gdpr.routes.js (513 lignes)
- history.js (88 lignes)
- journey.routes.js (73 lignes)
- mealPlan.routes.backup_20251102_175656.js (133 lignes)
- mealPlan.routes.backup_fix_20251102_182136.js (107 lignes)
- mealPlan.routes.backup_userid_20251102_182604.js (107 lignes)
- mealPlan.routes.js (107 lignes)
- ocr-analyze.routes.js (147 lignes)
- partner.routes.js (320 lignes)
- payment.routes.js (209 lignes)
- products-ocr.routes.js (229 lignes)
- products-search.js (65 lignes)
- products.js (539 lignes)
- provisional.routes.js (72 lignes)
- proxy.js (548 lignes)
- quota.js (239 lignes)
- scoring.routes.backup_20251103_200902.js (537 lignes)
- scoring.routes.BACKUP_LEAN_20251103_223137.js (329 lignes)
- scoring.routes.js (329 lignes)
- shopping-list.routes.js (189 lignes)
- stats.routes.js (79 lignes)
- test-minimal.js (96 lignes)
- test-partner.js (29 lignes)
- user.routes.backup_20251102_152202.js (529 lignes)
- user.routes.js (529 lignes)
- version.routes.js (22 lignes)
- vision.analyze.js (32 lignes)
- vision.ocr.public.js (59 lignes)
- vision.routes.js (159 lignes)
- vision.simple.js (42 lignes)
- webhooks.js (539 lignes)
## Services (95 fichiers)
- additiveEnrichment.service.js (79 lignes)
- aiCache.service.js (66 lignes)
- aiEnrichment.service.BACKUP2_20251103_220654.js (983 lignes)
- aiEnrichment.service.backup_20251102_200849.js (418 lignes)
- aiEnrichment.service.backup_20251103_193403.js (1023 lignes)
- aiEnrichment.service.BACKUP_20251103_220422.js (983 lignes)
- aiEnrichment.service.BACKUP_20251104_171401.js (418 lignes)
- aiEnrichment.service.BACKUP_20251104_171949.js (419 lignes)
- aiEnrichment.service.BACKUP_20251104_175332.js (387 lignes)
- aiEnrichment.service.BACKUP_BEFORE_SCORING_20251104_175617.js (387 lignes)
- aiEnrichment.service.BACKUP_COMPLETE_20251103_224501.js (427 lignes)
- aiEnrichment.service.BACKUP_DEBUG_20251103_222733.js (418 lignes)
- aiEnrichment.service.backup_final_20251103_205210.js (956 lignes)
- aiEnrichment.service.BACKUP_FINAL_20251103_223429.js (426 lignes)
- aiEnrichment.service.backup_fix2_20251102_204450.js (1023 lignes)
- aiEnrichment.service.backup_fix_20251102_202407.js (1022 lignes)
- aiEnrichment.service.BACKUP_FOOD_20251104_191052.js (431 lignes)
- aiEnrichment.service.BACKUP_MANUAL_20251103_224753.js (427 lignes)
- aiEnrichment.service.BACKUP_SCORING_FIX_20251104_183833.js (416 lignes)
- aiEnrichment.service.js (431 lignes)
- aiService.js (361 lignes)
- allergenEnrichment.service.js (66 lignes)
- alternatives.service.js (415 lignes)
- analyzeService.js (328 lignes)
- circuitBreaker.js (464 lignes)
- cosmeticsService.js (198 lignes)
- cronJobs.js (379 lignes)
- dataCompleteness.service.js (151 lignes)
- DataNormalizer.js (342 lignes)
- emailService.js (155 lignes)
- EnhancedOFFClient.js (86 lignes)
- gdprService.js (483 lignes)
- imageEnrichment.service.js (47 lignes)
- ingredientParser.service.js (61 lignes)
- mealPlan.service.js (136 lignes)
- ocr-parser.service.js (150 lignes)
- OCRProductService.js (323 lignes)
- offClient.enhanced.js (18 lignes)
- offClient.js (93 lignes)
- offClient.UTF16_BACKUP.js (80 lignes)
- openfoodfacts.service.js (199 lignes)
- productAnalysisService.js (955 lignes)
- ProductOrchestrator.backup_20251102_203146.js (552 lignes)
- ProductOrchestrator.backup_404fix_20251102_211021.js (579 lignes)
- ProductOrchestrator.BACKUP_SCORE_OVERRIDE_20251104_185415.js (587 lignes)
- ProductOrchestrator.js (588 lignes)
- productPrompt.service.js (60 lignes)
- quotaService.js (367 lignes)
- scoring.service.OLD_20251013.js (56 lignes)
- scoringEngine.AVANT_NOV.js (0 lignes)
- scoringEngine.AVANT_NOVA_FIX_20251007_232733.js (345 lignes)
- scoringEngine.backup_20251102_192814.js (342 lignes)
- scoringEngine.backup_20251103_173414.js (832 lignes)
- scoringEngine.js (832 lignes)
- ScoringEngineV3.js (400 lignes)
- scoringUnified.js (971 lignes)
- visionRuntime.js (89 lignes)
- webhookService.js (455 lignes)
- alternativesEngine.js (167 lignes)
- conversationalAI.js (249 lignes)
- deepSeekService.BACKUP3_20251103_221946.js (517 lignes)
- deepSeekService.BACKUP4_20251103_222152.js (517 lignes)
- deepSeekService.BACKUP6_20251103_222501.js (517 lignes)
- deepSeekService.backup_20251103_215112.js (517 lignes)
- deepSeekService.js (517 lignes)
- eco-score.service.js (221 lignes)
- insightsGenerator.js (257 lignes)
- mealPlanGenerator.service.js (269 lignes)
- mealPlanValidator.service.js (217 lignes)
- NutritionistChatService.js (553 lignes)
- productTypeDetector.js (252 lignes)
- algoliaService.js (659 lignes)
- algoliaSync.js (358 lignes)
- analysisService.js (385 lignes)
- CosmeticAnalysisService.js (414 lignes)
- cosmetics.js (455 lignes)
- DetergentAnalysisService.js (695 lignes)
- detergents.js (478 lignes)
- food.js (304 lignes)
- FoodAnalysisService.js (374 lignes)
- index.js (67 lignes)
- novaClassifier.js (197 lignes)
- nutriscoreCalculator.js (398 lignes)
- universalAnalyzer.js (787 lignes)
- authService.js (192 lignes)
- tokenService.js (171 lignes)
- openBeautyFactsService.js (151 lignes)
- openFoodFactsService.js (180 lignes)
- DataExportService.js (876 lignes)
- visionOCR.js (399 lignes)
- LemonSqueezyService.js (651 lignes)
- QueueService.js (96 lignes)
- CloudinaryService.js (49 lignes)
- ProductOCRService.js (848 lignes)
- VisionService.js (466 lignes)
## Models (18 fichiers)
- AffiliateClick.js (213 lignes)
- Analysis.js (207 lignes)
- ChatHistory.js (42 lignes)
- Consent.js (370 lignes)
- ContributionRequest.js (23 lignes)
- Favorite.js (89 lignes)
- GDPRLog.js (433 lignes)
- MealPlan.js (95 lignes)
- Payment.js (328 lignes)
- PaymentLog.js (827 lignes)
- Product.js (233 lignes)
- ShoppingList.js (87 lignes)
- TemporaryProduct.js (23 lignes)
- User.js (302 lignes)
- user.model.js (46 lignes)
- UserJourney.js (60 lignes)
- VisionAnalysis.js (190 lignes)
- WebhookLog.js (678 lignes)


# 📊 FRONTEND STRUCTURE SCAN

## Pages (49 fichiers)
- AboutPage.tsx (226 lignes)
- AiPreferencesPage.tsx (435 lignes)
- AssistantPage.tsx (280 lignes)
- AuthCallbackPage.tsx (57 lignes)
- CategoryPage.tsx (416 lignes)
- ChatPage.tsx (179 lignes)
- ComparePage.tsx (459 lignes)
- CosmeticAnalysisPage.tsx (466 lignes)
- DashboardPage.tsx (200 lignes)
- DetergentAnalysisPage.tsx (574 lignes)
- DiagnosticPage.tsx (362 lignes)
- EmailVerificationPage.tsx (128 lignes)
- FavoritesPage.tsx (138 lignes)
- HistoryPage.tsx (160 lignes)
- HomePage.tsx (392 lignes)
- LearnPage.tsx (286 lignes)
- LegalPage.tsx (152 lignes)
- LoginPage.tsx (253 lignes)
- MealPlanPage.tsx (97 lignes)
- MultiCategoriesPage.tsx (350 lignes)
- MultiScanPage.tsx (395 lignes)
- OCRWizardPage.tsx (538 lignes)
- OnboardingPage.tsx (394 lignes)
- PremiumPage.tsx (471 lignes)
- PricingPage.tsx (335 lignes)
- PrivacyPage.tsx (163 lignes)
- ProductDetailPage.tsx (0 lignes)
- ProductNotFoundPage.tsx (282 lignes)
- ProductPage.backup_20251102_123930.tsx (476 lignes)
- ProductPage.backup_20251102_125705.tsx (480 lignes)
- ProductPage.backup_20251102_162507.tsx (523 lignes)
- ProductPage.backup_20251103_182205.tsx (593 lignes)
- ProductPage.backup_final_20251102_170938.tsx (523 lignes)
- ProductPage.backup_fix_20251103_183542.tsx (593 lignes)
- ProductPage.backup_solution_20251102_171615.tsx (533 lignes)
- ProductPage.tsx (593 lignes)
- ProfilePage.tsx (650 lignes)
- RegisterPage.tsx (311 lignes)
- ResultsPage.tsx (270 lignes)
- ScanPageIntegrated.tsx (119 lignes)
- SearchPage.tsx (380 lignes)
- SettingsPage.tsx (719 lignes)
- ShoppingListPage.backup_20251102_131908.tsx (613 lignes)
- ShoppingListPage.backup_20251102_152931.tsx (648 lignes)
- ShoppingListPage.tsx (695 lignes)
- TermsPage.tsx (173 lignes)
- TestPage.tsx (26 lignes)
- UniversalSearchPage.tsx (313 lignes)
- PricingPage.tsx (301 lignes)
## Components (140 fichiers)
- AdvancedFilters.tsx (244 lignes)
- AffiliateButton.tsx (195 lignes)
- AlgoliaProductCard.tsx (164 lignes)
- AnalysisResultCard.tsx (241 lignes)
- CategoryCard.tsx (275 lignes)
- CategoryFilter.tsx (73 lignes)
- CategoryNavigation.tsx (61 lignes)
- CategorySelector.tsx (157 lignes)
- ConfidenceBadge.tsx (32 lignes)
- CookieBanner.tsx (129 lignes)
- DomainBadges.tsx (86 lignes)
- EcoScoreBadge.tsx (46 lignes)
- EmailVerificationBanner.tsx (80 lignes)
- EnvironmentScore.tsx (209 lignes)
- ErrorBoundary.tsx (108 lignes)
- ErrorMessage.tsx (16 lignes)
- EthicalScoreBadge.tsx (43 lignes)
- Footer.tsx (165 lignes)
- HealthScoreCircle.tsx (128 lignes)
- LanguageSelector.tsx (27 lignes)
- Layout.tsx (352 lignes)
- MockTestPanel.tsx (46 lignes)
- Navbar.backup_20251102_133259.tsx (677 lignes)
- Navbar.tsx (678 lignes)
- NoResultsFound.tsx (100 lignes)
- NotificationContainer.tsx (20 lignes)
- NovaBadge.tsx (193 lignes)
- NovaDetails.tsx (87 lignes)
- NovaResults.tsx (342 lignes)
- OCRPanel.tsx (159 lignes)
- OCRUpload.tsx (201 lignes)
- OfflineIndicator.tsx (69 lignes)
- PartnerLinks.tsx (112 lignes)
- PhotoAnalyzerEnhanced.tsx (44 lignes)
- PhotoCapture.tsx (414 lignes)
- PremiumCTA.tsx (37 lignes)
- PremiumUpgradeModal.tsx (240 lignes)
- PrivateRoute.tsx (34 lignes)
- ProductCard.tsx (143 lignes)
- ProductCardSkeleton.tsx (45 lignes)
- ProductDetail.tsx (147 lignes)
- ProductHit.tsx (187 lignes)
- ProtectedRoute.tsx (14 lignes)
- PWAInstallBanner.tsx (160 lignes)
- ResultCard.tsx (265 lignes)
- ScanFloatingButton.tsx (128 lignes)
- ScannerChoice.tsx (113 lignes)
- ScoreChip.tsx (51 lignes)
- ScoreProgressBar.tsx (153 lignes)
- SEOHead.tsx (80 lignes)
- SimilarProductsCarousel.tsx (46 lignes)
- TranslatedContent.tsx (31 lignes)
- UltraProcessingPanel.tsx (53 lignes)
- UltraTransformResults.tsx (70 lignes)
- ImportProgress.tsx (132 lignes)
- LogViewer.tsx (207 lignes)
- ProductTable.tsx (234 lignes)
- StatsCard.tsx (93 lignes)
- AIEngagementWidget.tsx (119 lignes)
- AIChat.tsx (351 lignes)
- AlternativesList.tsx (22 lignes)
- AlternativesSuggestions.tsx (60 lignes)
- CosmeticAnalysisDisplay.tsx (410 lignes)
- NovaAlert.tsx (274 lignes)
- ProgressiveAnalysis.tsx (492 lignes)
- QuickStatsWidget.tsx (223 lignes)
- RiskCard.tsx (21 lignes)
- ScientificScore.tsx (348 lignes)
- ScoreDisplay.tsx (27 lignes)
- ScoreGauge.tsx (53 lignes)
- ScoreGaugeEnhanced.tsx (17 lignes)
- UnifiedAnalysisResult.tsx (351 lignes)
- ChatBubble.tsx (9 lignes)
- ChatWidget.tsx (251 lignes)
- Badge.tsx (42 lignes)
- Button.tsx (37 lignes)
- LoadingSpinner.tsx (27 lignes)
- CommunityComparison.tsx (323 lignes)
- DailyAnalysesChart.tsx (302 lignes)
- RecommendationsSection.tsx (257 lignes)
- StatsCard.tsx (9 lignes)
- TrendSparkline.tsx (14 lignes)
- WeeklySummary.tsx (356 lignes)
- ConsentManager.tsx (343 lignes)
- Layout.tsx (35 lignes)
- MobileBottomNav.backup_20251102_133259.tsx (31 lignes)
- MobileBottomNav.tsx (31 lignes)
- Sidebar.tsx (213 lignes)
- DisclaimerModal.tsx (211 lignes)
- MealCard.tsx (131 lignes)
- MealPlanWizard.tsx (80 lignes)
- RecipeDetailModal.tsx (257 lignes)
- Step1BudgetPersonnes.tsx (117 lignes)
- Step2RegimeCuisine.tsx (195 lignes)
- Step3Allergenes.tsx (167 lignes)
- CheckoutButton.tsx (127 lignes)
- PremiumModal.tsx (231 lignes)
- AllergensSection.tsx (73 lignes)
- AlternativesPanel.tsx (406 lignes)
- EnrichmentResult.tsx (228 lignes)
- LabelsSection.tsx (45 lignes)
- NutritionBar.tsx (51 lignes)
- ProductActions.tsx (227 lignes)
- ProductAlternatives.tsx (96 lignes)
- ProductChatActions.tsx (81 lignes)
- ProductHeader.tsx (133 lignes)
- ProductIngredients.tsx (57 lignes)
- ProductIngredientsSection.tsx (267 lignes)
- ProductMainActions.backup2_20251102_160539.tsx (188 lignes)
- ProductMainActions.backup3_20251102_161310.tsx (201 lignes)
- ProductMainActions.backup_20251102_124248.tsx (167 lignes)
- ProductMainActions.backup_20251102_155709.tsx (149 lignes)
- ProductMainActions.backup_20251102_162521.tsx (212 lignes)
- ProductMainActions.backup_20251102_163245.tsx (110 lignes)
- ProductMainActions.backup_meal_20251102_180631.tsx (112 lignes)
- ProductMainActions.tsx (156 lignes)
- ProductNutrition.tsx (128 lignes)
- ProductScoresCard.tsx (65 lignes)
- ScoreBreakdown.tsx (417 lignes)
- PreferencesTab.tsx (317 lignes)
- QuotaAlert.tsx (271 lignes)
- QuotaBanner.tsx (0 lignes)
- QuotaBar.tsx (185 lignes)
- BarcodeScanner.tsx (650 lignes)
- BarcodeScannerEnhanced.tsx (245 lignes)
- CategoryAutoDetector.tsx (93 lignes)
- EnhancedBarcodeScanner.tsx (692 lignes)
- ManualInput.tsx (77 lignes)
- ManualSearch.tsx (381 lignes)
- OCRGuide.tsx (147 lignes)
- PhotoCapture.tsx (168 lignes)
- UnknownProductModal.tsx (70 lignes)
- BarcodeScanner.spec.tsx (23 lignes)
- FiltersPanel.tsx (212 lignes)
- SearchBar.tsx (243 lignes)
- SearchExperience.tsx (95 lignes)
- ShoppingListOptimizer.tsx (275 lignes)
- LoadingStates.tsx (166 lignes)
- ScoreBar.tsx (88 lignes)
- SmartUpgradeModal.tsx (331 lignes)
## Services (53 fichiers)
- .ts (0 lignes)
- adminApi.ts (148 lignes)
- aiAnalysisService.ts (88 lignes)
- aiService.ts (13 lignes)
- alternativesService.ts (204 lignes)
- analysisService.ts (210 lignes)
- analyticsService.ts (18 lignes)
- api.ts (100 lignes)
- ApiAdapter.ts (73 lignes)
- apiClient.ts (198 lignes)
- authService.ts (175 lignes)
- chatService.ts (92 lignes)
- cloudinaryService.ts (195 lignes)
- configService.ts (27 lignes)
- dashboardService.ts (35 lignes)
- demoMode.ts (214 lignes)
- demoService.ts (446 lignes)
- EmailService.ts (391 lignes)
- emailValidationService.ts (49 lignes)
- errorHandling.ts (268 lignes)
- exportService.ts (298 lignes)
- fallbackService.ts (25 lignes)
- favoritesService.ts (37 lignes)
- history.service.ts (42 lignes)
- historyService.ts (76 lignes)
- historySyncService.ts (33 lignes)
- index.ts (124 lignes)
- mealPlanService.ts (81 lignes)
- multiCategoryApi.ts (378 lignes)
- notificationService.ts (27 lignes)
- novaAdapter.ts (457 lignes)
- ocr-api.ts (38 lignes)
- ocrService.ts (52 lignes)
- offlineService.ts (19 lignes)
- paymentService.ts (135 lignes)
- productSaveService.ts (34 lignes)
- productService.ts (68 lignes)
- quotaService.ts (374 lignes)
- scanService.ts (148 lignes)
- searchService.ts (271 lignes)
- UserAnalytics.ts (782 lignes)
- userService.ts (35 lignes)
- visionService.ts (151 lignes)
- AIAnalysisService.ts (61 lignes)
- DeepSeekClient.ts (232 lignes)
- DeepSeekECOLOJIAService.ts (129 lignes)
- novaClassifier.ts (732 lignes)
- ultraTransformService.ts (444 lignes)
- client.ts (24 lignes)
- ApiAdapter.ts (74 lignes)
- UniversalSearchService.ts (1249 lignes)
- SecureProxyService.ts (286 lignes)
- analysisService.spec.ts (27 lignes)


# 📄 FICHIERS CRITIQUES (CONTENU COMPLET)

## 1. aiEnrichment.service.js
```javascript
const deepSeekService = require('./ai/deepSeekService');
const logger = require('../utils/logger');
const Product = require('../models/Product');

/**
 * ✅ ECOLOJIA V3 - AI Enrichment Service
 * Enrichit les produits avec données manquantes via DeepSeek AI
 */

// Listes des additifs par risque
const ADDITIVES_LISTS = {
  SAFE: ['E300', 'E330', 'E440', 'E500', 'E322'],
  MODERATE: ['E250', 'E251', 'E338'],
  DANGEROUS: ['E102', 'E110', 'E123', 'E129', 'E951']
};

/**
 * Enrichir produit alimentaire avec IA
 */
async function enrichFoodProduct(product, missingFields = []) {
  try {
    console.log(`[AI] Requesting new estimations for ${product.barcode} category: food`);
    
    const response = await deepSeekService.analyzeProduct(product, 'food');
    
    // ✅ FIX: Sécuriser l'affichage de la réponse
    const displayResponse = () => {
      if (!response) return "Response is null/undefined";
      if (typeof response === "string") return response.substring(0, 200) + "...";
      try {
        const jsonStr = JSON.stringify(response);
        return jsonStr ? jsonStr.substring(0, 200) + "..." : "Cannot stringify response";
      } catch (e) {
        return "Response not serializable";
      }
    };
    console.log("[AI] Raw response:", displayResponse());

    const parsed = parseAIResponseByCategory(response, 'food', missingFields);
    
    return {
      success: true,
      estimations: parsed,
      aiEnriched: true
    };
  } catch (error) {
    console.error('[AI] enrichFoodProduct failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Estimer valeurs nutritionnelles manquantes
 */
async function estimateMissingData(product, category = 'food', missingFields = []) {
  try {
    console.log(`[AI] Estimating ${missingFields.join(', ')} for category: ${category}`);
    
    const response = await deepSeekService.analyzeProduct(product, category);
    
    const parsed = parseAIResponseByCategory(response, category, missingFields);
    
    if (!parsed) {
      console.log('[AI] Parsed estimations: NULL');
      return null;
    }
    
    console.log('[AI] Parsed estimations:', JSON.stringify(parsed).substring(0, 200));
    
    return {
      estimations: parsed,
      estimatedAt: new Date(),
      estimatedBy: 'deepseek-v3',
      confidence: 0.75
    };
  } catch (error) {
    console.error('[AI] estimateMissingData failed:', error.message);
    return null;
  }
}

/**
 * Enrichir avec résumé textuel IA
 */
async function enrichWithAISummary(product, category = 'food') {
  try {
    const response = await deepSeekService.analyzeProduct(product, category);
    
    return {
      success: true,
      data: {
        summary: response,
        generatedAt: new Date()
      }
    };
  } catch (error) {
    console.error('[AI] enrichWithAISummary failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Enrichir produit cosmétique
 */
async function enrichCosmeticsProduct(product, missingFields = []) {
  try {
    console.log('[DEBUG enrichCosmeticsProduct] Barcode:', product.barcode);
    const response = await deepSeekService.analyzeProduct(product, 'cosmetics');
    const parsed = parseAIResponseByCategory(response, 'cosmetics', missingFields);
    console.log('[DEBUG] Parsed:', JSON.stringify(parsed, null, 2));

    if (parsed && (parsed.ingredients?.length || parsed.allergens?.length)) {
      const updateData = {};
      if (parsed.ingredients?.length) updateData['cosmeticsData.ingredients'] = parsed.ingredients;
      if (parsed.allergens?.length) updateData['cosmeticsData.allergens'] = parsed.allergens;
      if (parsed.endocrineDisruptors?.length) updateData['cosmeticsData.endocrineDisruptors'] = parsed.endocrineDisruptors;
      updateData['metadata.lastEnriched'] = new Date();
      updateData['metadata.aiEnrichmentVersion'] = '3.3';
      
      await Product.updateOne({ _id: product._id }, { $set: updateData });
      console.log('[AI] ✅ Cosmétique sauvegardé en base');
      return { success: true, enriched: parsed };
    }
    return { success: true, enriched: {} };
  } catch (error) {
    console.error('[AI] ❌ Erreur:', error.message);
    return { success: false, error: error.message };
  }
}
async function enrichDetergentsProduct(product, missingFields = []) {
  try {
    console.log('[DEBUG enrichDetergentsProduct] Barcode:', product.barcode);
    const response = await deepSeekService.analyzeProduct(product, 'detergents');
    const parsed = parseAIResponseByCategory(response, 'detergents', missingFields);
    console.log('[DEBUG] Parsed:', JSON.stringify(parsed, null, 2));

    if (parsed && (parsed.composition?.length || parsed.surfactants?.length)) {
      const updateData = {};
      if (parsed.composition?.length) updateData['detergentsData.composition'] = parsed.composition;
      if (parsed.surfactants?.length) updateData['detergentsData.surfactants'] = parsed.surfactants;
      if (parsed.ecolabels?.length) updateData['detergentsData.ecolabels'] = parsed.ecolabels;
      updateData['metadata.lastEnriched'] = new Date();
      updateData['metadata.aiEnrichmentVersion'] = '3.3';
      
      await Product.updateOne({ _id: product._id }, { $set: updateData });
      console.log('[AI] ✅ Détergent sauvegardé en base');
      return { success: true, enriched: parsed };
    }
    return { success: true, enriched: {} };
  } catch (error) {
    console.error('[AI] ❌ Erreur:', error.message);
    return { success: false, error: error.message };
  }
}
/**
 * Enrichir produit avec IA selon catégorie
 */
async function enrichProductWithAI(product, category = 'food', options = {}) {
  const { force = false } = options;
  try {
    if (!product || !product.barcode) {
      throw new Error('Produit invalide ou barcode manquant');
    }
    
    const missingFields = identifyMissingFields(product, category);
    
    if (missingFields.length === 0 && !force) {
      return {
        success: true,
        message: 'Produit déjà complet - Utilisez force:true pour enrichir quand même',
        aiEnriched: false
      };
    }
    
    // Si force=true, on enrichit même sans champs manquants
    if (force && missingFields.length === 0) {
      console.log('[AI] Enrichissement forcé demandé - recalcul avec IA pour améliorer précision');
    }
    
    let result;
    switch(category) {
      case 'food':
        result = await enrichFoodProduct(product, missingFields);
        break;
      case 'cosmetics':
        result = await enrichCosmeticsProduct(product, missingFields);
        break;
      case 'detergents':
        result = await enrichDetergentsProduct(product, missingFields);
        break;
      default:
        throw new Error(`Catégorie non supportée: ${category}`);
    }
    
    // ✅ NOUVEAU : Recharger le produit et recalculer le score
    if (result.success) {
      console.log('[AI] ✅ Données enrichies sauvegardées, recalcul du score...');
      
      // Recharger le produit avec les données fraîches
      const freshProduct = await Product.findOne({ barcode: product.barcode });
      
      if (freshProduct) {
        // Recalculer le score avec le scoring engine
        const scoringUnified = require('./scoringUnified');
        
        // Préparer données pour scoring
        const scoringData = {
          category: freshProduct.category || category,
          ...freshProduct.toObject()
        };
        
        console.log('[AI] 🔍 scoringData:', JSON.stringify({
          category: scoringData.category,
          hasIngredients: !!scoringData.cosmeticsData?.ingredients,
          ingredientsCount: scoringData.cosmeticsData?.ingredients?.length
        }, null, 2));
        
        const newScores = scoringUnified.calculateScores(scoringData);
        
        console.log('[AI] 🔍 newScores:', JSON.stringify(newScores, null, 2));
        
        // Sauvegarder le nouveau score
        await Product.updateOne(
          { _id: freshProduct._id },
          {
            $set: {
              scores: newScores,
              'metadata.lastScored': new Date()
            }
          }
        );
        
        console.log('[AI] ✅ Score recalculé:', newScores?.overallScore || 'N/A');
        
        result.newScore = newScores?.overallScore;
      }
    }

    return result;
  } catch (error) {
    console.error('[AI] Enrichment failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Identifier champs manquants
 */
function identifyMissingFields(product, category) {
  const missing = [];
  
  if (category === 'food') {
    const nutriments = product.foodData?.nutritionalInfo || product.nutriments || {};
    
    if (!nutriments.sugars && nutriments.sugars !== 0) missing.push('sugars');
    if (!nutriments.saturatedFat && nutriments.saturatedFat !== 0) missing.push('saturatedFat');
    if (!nutriments.salt && nutriments.salt !== 0) missing.push('salt');
    if (!nutriments.fiber && nutriments.fiber !== 0) missing.push('fiber');
  }
  
  return missing;
}

/**
 * ✅ CORRECTION COMPLÈTE: Parser réponse IA selon catégorie
 */
function parseAIResponseByCategory(response, category, missingFields) {
  try {
    // ✅ FIX: Gérer response objet OU string
    let parsed;
    
    if (typeof response === 'object' && response !== null) {
      // DeepSeek retourne déjà un objet parsé
      parsed = response;
      console.log('[AI] Response is already an object');
    } else if (typeof response === 'string') {
      // Extraire JSON de la string
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[AI] No JSON found in response string');
        return null;
      }
      parsed = JSON.parse(jsonMatch[0]);
      console.log('[AI] Parsed JSON from string');
    } else {
      console.error('[AI] Invalid response type:', typeof response);
      return null;
    }
    
    switch(category) {
      case 'food':
        return parseFoodResponse(parsed, missingFields);
      case 'cosmetics':
        return parseCosmeticsResponse(parsed, missingFields);
      case 'detergents':
        return parseDetergentsResponse(parsed, missingFields);
      default:
        return parsed;
    }
  } catch (error) {
    console.error('[AI] Parse error:', error.message);
    return null;
  }
}

/**
 * Parser réponse alimentaire
 */
function parseFoodResponse(parsed, missingFields) {
  const result = {};
  
  if (parsed.nutriments || parsed.nutritionalInfo) {
    const nutriments = parsed.nutriments || parsed.nutritionalInfo;
    
    if (missingFields.includes('sugars') && nutriments.sugars !== undefined && nutriments.sugars !== null) {
      result.sugars = parseFloat(nutriments.sugars);
    }
    if (missingFields.includes('saturatedFat') && nutriments.saturatedFat !== undefined && nutriments.saturatedFat !== null) {
      result.saturatedFat = parseFloat(nutriments.saturatedFat);
    }
    if (missingFields.includes('salt') && nutriments.salt !== undefined && nutriments.salt !== null) {
      result.salt = parseFloat(nutriments.salt);
    }
    if (missingFields.includes('fiber') && nutriments.fiber !== undefined && nutriments.fiber !== null) {
      result.fiber = parseFloat(nutriments.fiber);
    }
  }
  
  if (parsed.additives) {
    result.additives = parsed.additives;
  }
  
  if (parsed.novaGroup) {
    result.novaGroup = parseInt(parsed.novaGroup);
  }
  
  return result;
}

/**
 * Parser réponse cosmétique
 */
function parseCosmeticsResponse(parsed, missingFields) {
  const result = {};
  
  if (parsed.ingredients) {
    result.ingredients = parsed.ingredients;
  }
  
  if (parsed.allergens) {
    result.allergens = parsed.allergens;
  }
  
  if (parsed.endocrineDisruptors) {
    result.endocrineDisruptors = parsed.endocrineDisruptors;
  }
  
  return result;
}

/**
 * Parser réponse détergent
 */
function parseDetergentsResponse(parsed, missingFields) {
  const result = {};
  
  if (parsed.composition) {
    result.composition = parsed.composition;
  }
  
  if (parsed.surfactants) {
    result.surfactants = parsed.surfactants;
  }
  
  if (parsed.ecolabels) {
    result.ecolabels = parsed.ecolabels;
  }
  
  return result;
}

/**
 * Générer alternatives via IA
 */
async function generateAlternatives(product, category = 'food', count = 3) {
  try {
    const messages = [
      {
        role: 'system',
        content: `Tu es un expert en nutrition. Suggère ${count} alternatives plus saines au produit donné. Réponds en JSON avec: { "alternatives": [{ "name": "...", "reason": "..." }] }`
      },
      {
        role: 'user',
        content: `Produit: ${product.name || product.product_name}\nMarque: ${product.brand || product.brands}\nCatégorie: ${category}`
      }
    ];
    
    const response = await deepSeekService.chat(messages);
    
    try {
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanResponse);
      return parsed.alternatives || [];
    } catch (parseError) {
      throw new Error('IA response not valid JSON');
    }
  } catch (error) {
    console.error('[AI] generateAlternatives failed:', error.message);
    return [];
  }
}

module.exports = {
  enrichProductWithAI,
  enrichFoodProduct,
  enrichCosmeticsProduct,
  enrichDetergentsProduct,
  estimateMissingData,
  enrichWithAISummary,
  generateAlternatives,
  identifyMissingFields
};

```

## 2. ProductOrchestrator.js
```javascript
// backend/src/services/ProductOrchestrator.js
/**
 * Orchestrateur central pour récupération/création produits
 * Gère enrichissement automatique et cache IA
 * 
 * CORRECTION CRITIQUE : Crée le produit en base AVANT enrichissement IA
 * pour garantir un _id MongoDB valide
 */

const Product = require('../models/Product');
const DataNormalizer = require('./DataNormalizer');
const ScoringEngineV3 = require('./ScoringEngineV3');
const offClient = require('./offClient');
const scoringUnified = require('./scoringUnified');
const aiEnrichment = require('./aiEnrichment.service');
const visionService = require('./vision/VisionService');

/**
 * Détecte si un code-barre correspond à une catégorie valide
 * @param {string} barcode - Code-barre du produit
 * @returns {Object} { isValid, reason, detectedType }
 */
function detectProductCategory(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    return { isValid: false, reason: 'Barcode invalide', detectedType: 'INVALID' };
  }

  // Livres (ISBN-13)
  if (barcode.startsWith('978') || barcode.startsWith('979')) {
    return {
      isValid: false,
      reason: 'Code-barre de livre (ISBN) détecté',
      detectedType: 'BOOK'
    };
  }

  // Médicaments France (codes CIP)
  if (barcode.startsWith('3400') || barcode.startsWith('3401')) {
    return {
      isValid: false,
      reason: 'Code-barre de médicament détecté',
      detectedType: 'MEDICINE'
    };
  }

  // Médicaments internationaux (codes spécifiques)
  if (barcode.length === 13 && barcode.startsWith('34')) {
    return {
      isValid: false,
      reason: 'Code-barre pharmaceutique détecté',
      detectedType: 'MEDICINE'
    };
  }

  // Codes-barres valides pour nos catégories
  return { isValid: true, detectedType: 'VALID' };
}

/**
 * Point d'entrée unique pour obtenir un produit (avec enrichissement auto)
 * @param {Object} input - { barcode, source }
 * @returns {Promise<Object>} Produit enrichi
 */
async function getOrCreateProduct(input) {
  const { barcode, source = 'OFF' } = input;

  if (!barcode) {
    throw new Error('Barcode requis');
  }

  // 0. Vérifier catégorie valide (filtrage médicaments/livres)
  const categoryCheck = detectProductCategory(barcode);
  if (!categoryCheck.isValid) {
    console.log('[Orchestrator] Invalid category detected:', categoryCheck);
    return {
      product: null,
      source: 'INVALID_CATEGORY',
      error: categoryCheck.reason,
      detectedType: categoryCheck.detectedType,
      suggestion: 'Ce type de produit n\'est pas analysable par ECOLOJIA'
    };
  }

  // 1. Chercher en base
  let product = await Product.findOne({ barcode }).lean();

  // ✅ CORRECTION : Ne pas recalculer si un score valide existe
  if (product && product.scores?.overallScore !== null && product.scores?.overallScore !== undefined) {
    console.log('[Orchestrator] Product found in DB with valid score:', barcode, '- Score:', product.scores.overallScore);
    return {
      product,
      source: 'DATABASE',
      cached: true
    };
  }

  // 2. Récupérer depuis OpenFoodFacts si pas en base
  if (!product) {
    console.log('[Orchestrator] Fetching from OFF:', barcode);
    const offData = await offClient.fetchFromOpenFoodFacts(barcode);

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

  }

  // 3. NOUVELLE ARCHITECTURE : Normaliser puis scorer
  console.log('📦 [Orchestrator] Normalisation des données...');
  const normalizedProduct = DataNormalizer.normalizeProduct(product, product._id ? 'DATABASE' : 'OFF');

  console.log('🎯 [Orchestrator] Calcul scientifique du score...');
  const scoringResult = ScoringEngineV3.calculateScore(normalizedProduct);

  console.log('📊 [Orchestrator] Résultat:', {
    canScore: scoringResult.canScore,
    score: scoringResult.overallScore,
    confidence: scoringResult.confidence,
    available: scoringResult.availableComponents?.length || 0,
    missing: scoringResult.missingComponents?.length || 0
  });

  // 4. Enrichir avec IA UNIQUEMENT si confiance < 70%
  let finalScores = scoringResult;
  let aiUsed = false;

  // ============================================================================
  // 🔧 CORRECTION CRITIQUE : CRÉER LE PRODUIT EN BASE AVANT ENRICHISSEMENT IA
  // ============================================================================
  
  if (!scoringResult.canScore || scoringResult.confidence < 70) {
    console.log('⚠️ [Orchestrator] Données insuffisantes - Enrichissement IA nécessaire');
    
    // ✅ NOUVEAU : Si le produit n'existe pas en base, le créer MAINTENANT
    if (!product._id) {
      console.log('[Orchestrator] 💾 Création produit en base AVANT enrichissement IA...');
      
      const tempProduct = new Product({
        barcode,
        name: normalizedProduct.product_name || 'Produit inconnu',
        brand: normalizedProduct.brands || '',
        category: normalizedProduct.category || 'cosmetics',
        source: 'OFF',
        scores: {
          overallScore: 50,
          confidence: 0.3,
          dataCompleteness: 'Faible',
          calculatedAt: new Date()
        },
        // Préserver les données OFF/normalized
        ...normalizedProduct
      });
      
      product = await tempProduct.save();
      console.log('[Orchestrator] ✅ Produit créé avec _id:', product._id);
      
      // Mettre à jour normalizedProduct avec l'_id
      normalizedProduct._id = product._id;
    }
    
    // Maintenant on peut enrichir avec l'IA (le produit a un _id valide)
    const aiResult = await aiEnrichment.enrichProductWithAI(normalizedProduct, scoringResult);

    // Re-normaliser avec données IA
    const enrichedProduct = DataNormalizer.normalizeProduct({
      ...normalizedProduct,
      ...aiResult.estimations
    }, 'AI');

    // Re-calculer scores
    finalScores = ScoringEngineV3.calculateScore(enrichedProduct);
    aiUsed = true;
  } else {
    console.log('✅ [Orchestrator] Données suffisantes - Pas d\'enrichissement IA nécessaire');
  }

  // 5. Sauvegarder scores finaux en base
  // ✅ CORRECTION : Préserver dataCompleteness depuis MongoDB
  if (finalScores && !finalScores.dataCompleteness) {
    // Si le produit existe déjà en base, préserver son dataCompleteness
    const existingDataCompleteness = product.scores?.dataCompleteness;
    if (existingDataCompleteness) {
      finalScores.dataCompleteness = existingDataCompleteness;
    } else {
      // Sinon calculer selon la confiance
      finalScores.dataCompleteness = finalScores.confidence >= 0.85 ? "Excellente" :
                                      finalScores.confidence >= 0.65 ? "Bonne" : "Partielle";
    }
  }

  const productData = product.toObject ? product.toObject() : product;
  const savedProduct = await saveProduct({
    ...productData,
    scores: finalScores
  });

  return {
    product: savedProduct,
    source: product._id ? 'DATABASE_UPDATED' : 'OFF_NEW',
    cached: false,
    aiEnrichmentUsed: aiUsed
  };
}

/**
 * Crée un produit depuis une image (OCR + IA)
 * Utilisé quand OpenFoodFacts ne trouve pas le produit
 */
async function createProductFromImage(input) {
  const { barcode, imageFile } = input;

  try {
    console.log('[Orchestrator] 🔍 Analyse image pour produit inconnu:', barcode);

    // 1. OCR avec Google Vision
    console.log('[Orchestrator] 📷 Extraction texte via OCR...');
    const ocrResult = await visionService.extractText(imageFile);

    if (!ocrResult || !ocrResult.text) {
      throw new Error('OCR échoué : aucun texte extrait');
    }

    console.log('[Orchestrator] ✅ Texte extrait:', ocrResult.text.substring(0, 200) + '...');

    // 2. Parser avec DeepSeek IA
    console.log('[Orchestrator] 🤖 Parsing IA des données produit...');
    const parsedProduct = await aiEnrichment.parseProductFromOCR(ocrResult.text, barcode);

    if (!parsedProduct || !parsedProduct.name) {
      throw new Error('IA parsing échoué : données insuffisantes');
    }

    console.log('[Orchestrator] ✅ Produit parsé:', parsedProduct.name);

    // 3. Calculer scores selon catégorie détectée
    const scoringData = prepareScoringData(parsedProduct);

    let scores;
    if (parsedProduct.category === 'cosmetics') {
      scores = scoringUnified.calculateCosmeticsScores(scoringData);
    } else if (parsedProduct.category === 'detergents') {
      scores = scoringUnified.calculateDetergentsScores(scoringData);
    } else {
      scores = scoringUnified.calculateFoodScores(scoringData);
    }

    console.log('[Orchestrator] 📊 Score calculé:', scores.overallScore);

    // 4. Créer produit en base avec flag IA
    const productToSave = {
      barcode: barcode,
      name: parsedProduct.name,
      brand: parsedProduct.brand,
      category: parsedProduct.category || 'food',

      foodData: parsedProduct.category === 'food' ? {
        ingredients: parsedProduct.ingredients_text,
        nutrition: { per100g: parsedProduct.nutriments },
        novaGroup: parsedProduct.novaGroup,
        nutriScore: parsedProduct.nutriScore,
        additives: parsedProduct.additives,
        labels: parsedProduct.labels
      } : undefined,

      cosmeticsData: parsedProduct.category === 'cosmetics' ? {
        inci: parsedProduct.inci || [],
        concerns: parsedProduct.concerns || []
      } : undefined,

      detergentsData: parsedProduct.category === 'detergents' ? {
        ingredients: parsedProduct.ingredients || [],
        hazards: parsedProduct.hazards || []
      } : undefined,

      scores: scores,
      aiGenerated: true,
      aiConfidence: parsedProduct.confidence || scores.dataQuality?.confidence || 0.5,
      source: 'AI_OCR',
      createdAt: new Date(),
      lastSync: new Date()
    };

    const savedProduct = await saveProduct(productToSave);

    console.log('[Orchestrator] ✅ Produit IA créé avec succès:', savedProduct._id);

    return {
      product: savedProduct,
      source: 'AI_GENERATED',
      cached: false,
      aiEnrichmentUsed: true,
      method: 'OCR + DeepSeek'
    };

  } catch (error) {
    console.error('[Orchestrator] ❌ Erreur création produit IA:', error);
    return {
      product: null,
      source: 'AI_ERROR',
      error: `Analyse IA échouée : ${error.message}`
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function isScoreRecent(scores) {
  if (!scores.calculatedAt) return false;

  const calculatedAt = new Date(scores.calculatedAt);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return calculatedAt > sevenDaysAgo;
}

function mapOFFToProduct(offData) {
  return {
    barcode: offData.code,
    name: offData.product_name || offData.generic_name,
    brand: offData.brands,
    category: 'food',
    image_url: offData.image_url,

    // Données food
    nova_group: offData.nova_group,
    nutriscore_grade: offData.nutriscore_grade,
    ecoscore_grade: offData.ecoscore_grade,
    additives_tags: offData.additives_tags || [],
    labels_tags: offData.labels_tags || [],
    ingredients_text: offData.ingredients_text,
    packaging: offData.packaging,
    origins: offData.origins,

    // Nutriments
    nutriments: offData.nutriments || {},

    // Metadata
    source: 'openfoodfacts',
    lastSync: new Date()
  };
}

function prepareScoringData(product) {
  // Structure flexible qui supporte produits OFF bruts ET produits MongoDB

  // 1. Identifier la source des données
  const isMongoProduct = product.foodData !== undefined;

  // 2. Extraire les nutriments selon la source
  let nutriments = {};
  if (isMongoProduct) {
    // Produit MongoDB : chercher dans foodData
    const nutrition = product.foodData?.nutrition?.per100g || {};
    const nutritionalInfo = product.foodData?.nutritionalInfo || {};
    nutriments = {
      sugars_100g: nutrition.sugars || nutritionalInfo.sugars,
      sugars: nutrition.sugars || nutritionalInfo.sugars,
      'saturated-fat_100g': nutrition.saturatedFat || nutritionalInfo.saturatedFat,
      saturated_fat: nutrition.saturatedFat || nutritionalInfo.saturatedFat,
      salt_100g: nutrition.salt || nutritionalInfo.salt,
      salt: nutrition.salt || nutritionalInfo.salt
    };
  } else {
    // Produit OFF brut : utiliser nutriments directement
    const rawNutriments = product.nutriments || {};
    nutriments = {
      sugars_100g: rawNutriments.sugars_100g || rawNutriments.sugars,
      sugars: rawNutriments.sugars_100g || rawNutriments.sugars,
      'saturated-fat_100g': rawNutriments['saturated-fat_100g'] || rawNutriments.saturated_fat,
      saturated_fat: rawNutriments['saturated-fat_100g'] || rawNutriments.saturated_fat,
      salt_100g: rawNutriments.salt_100g || rawNutriments.salt,
      salt: rawNutriments.salt_100g || rawNutriments.salt
    };
  }

  // 3. Construire l'objet de scoring unifié
  return {
    // Champs requis pour calculateDataConfidence
    product_name: product.product_name || product.name || '',
    brands: product.brands || product.brand || '',
    ingredients_text: product.ingredients_text || product.foodData?.ingredients || '',

    // Scores et labels
    novaGroup: product.nova_group || product.foodData?.novaGroup,
    nutriScore: product.nutriscore_grade || product.foodData?.nutriScore,
    ecoScore: product.ecoscore_grade || product.foodData?.ecoScore,

    // Additifs (extraire les codes si objets)
    additives: isMongoProduct
      ? (product.foodData?.additives?.map(a => a.code || a) || [])
      : (product.additives_tags || []),

    // Labels
    labels: product.labels_tags || product.foodData?.labels || [],

    // Catégories et packaging
    categories: product.categories_tags || [],
    packaging: product.packaging || '',

    // Nutriments unifiés
    nutriments
  };
}

async function saveProduct(productData) {
  const { barcode } = productData;

  // Update ou insert
  const updated = await Product.findOneAndUpdate(
    { barcode },
    { $set: productData },
    { upsert: true, new: true }
  );

  return updated;
}

/**
 * Crée un produit depuis données OCR avec scoring ajusté
 * @param {Object} ocrData - Données extraites par OCR
 * @returns {Promise<Object>} - Produit créé avec scores
 */
async function createFromOCR(ocrData) {
  try {
    const {
      code,
      product_name,
      brands,
      quantity,
      ingredients_text,
      categories_tags = ['en:food'],
      source = 'ocr',
      confidence = 0.7,
      ocrMetadata = {}
    } = ocrData;

    console.log(`[Orchestrator] Création produit OCR: ${code} - "${product_name}"`);

    // Vérifier si le produit existe déjà
    const existingProduct = await Product.findOne({ code });
    if (existingProduct) {
      console.log(`[Orchestrator] Produit ${code} existe déjà, mise à jour...`);

      // Mettre à jour avec données OCR si meilleure confiance
      if (existingProduct.confidence && existingProduct.confidence >= confidence) {
        console.log(`[Orchestrator] Confiance existante supérieure, abandon mise à jour`);
        return existingProduct;
      }
    }

    // Normaliser les données avec DataNormalizer
    const normalizedData = DataNormalizer.normalizeFromOCR({
      code,
      product_name,
      brands,
      quantity,
      ingredients_text,
      categories_tags
    });

    console.log('[Orchestrator] Données normalisées:', {
      name: normalizedData.product_name,
      ingredients: normalizedData.ingredients?.length || 0
    });

    // Calculer les scores avec ScoringEngineV3
    console.log('[Orchestrator] Calcul des scores...');
    const category = _detectCategory(categories_tags);
    const scores = ScoringEngineV3.calculateScores(normalizedData, category);

    // Ajuster la confiance des scores selon la confiance OCR
    if (scores && confidence < 1) {
      scores.confidence = scores.confidence * confidence;
      scores.metadata = scores.metadata || {};
      scores.metadata.ocrConfidence = confidence;
      scores.metadata.adjustedByOCR = true;

      console.log(`[Orchestrator] Confiance ajustée: ${scores.confidence.toFixed(2)} (base × OCR ${confidence})`);
    }

    // Créer l'objet produit avec métadonnées OCR
    const productData = {
      code,
      product_name,
      brands,
      quantity,
      ingredients_text,
      categories_tags,

      // Scores calculés
      scores: scores || null,

      // Métadonnées OCR
      source,
      confidence,
      dataQuality: _assessDataQuality(normalizedData, confidence),
      ocrMetadata: {
        ...ocrMetadata,
        createdAt: new Date(),
        version: '3.2.0'
      },

      // Flags spéciaux
      needsVerification: confidence < 0.75,
      isOCRProduct: true,

      // Audit
      lastUpdated: new Date(),
      createdAt: new Date()
    };

    // Sauvegarder en base
    const product = existingProduct
      ? await Product.findOneAndUpdate({ code }, productData, { new: true })
      : await Product.create(productData);

    console.log(`[Orchestrator] ✓ Produit ${existingProduct ? 'mis à jour' : 'créé'}: ${product._id}`);

    // Indexer dans Algolia (si disponible)
    try {
      if (typeof algoliaService !== 'undefined') {
        await algoliaService.indexProduct(product);
        console.log('[Orchestrator] ✓ Produit indexé dans Algolia');
      }
    } catch (algoliaError) {
      console.warn('[Orchestrator] Erreur indexation Algolia:', algoliaError.message);
    }

    return product;

  } catch (error) {
    console.error('[Orchestrator] Erreur création produit OCR:', error);
    throw error;
  }
}

/**
 * Détecte la catégorie depuis tags
 */
function _detectCategory(categories_tags) {
  // TODO: Implémenter détection catégorie
  return 'food';
}

/**
 * Évalue la qualité des données OCR
 */
function _assessDataQuality(data, confidence) {
  const hasName = !!data.product_name && data.product_name.length > 3;
  const hasIngredients = !!data.ingredients_text && data.ingredients_text.length > 10;
  const hasBrand = !!data.brands && data.brands.length > 0;

  if (confidence >= 0.8 && hasName && hasIngredients && hasBrand) {
    return 'EXCELLENT';
  } else if (confidence >= 0.65 && hasName && hasIngredients) {
    return 'BON';
  } else if (confidence >= 0.5 && hasName) {
    return 'MOYEN';
  } else {
    return 'FAIBLE';
  }
}

module.exports = {
  getOrCreateProduct
};

```

## 3. scoringUnified.js (premières 100 lignes)
```javascript
// backend/src/services/scoringUnified.js

// ============================================
// LISTES D'ADDITIFS
// ============================================
const ADDITIVES_RED_LIST = ['E250','E251','E252','E621','E622','E623','E150c','E150d','E320','E321','E951','E104','E110','E122','E124','E129','E216','E217','E214','E215'];
const ADDITIVES_ORANGE_LIST = ['E330','E200','E202','E211','E212','E322','E471','E472','E473','E476'];

// ============================================
// SEUILS DE CONFIANCE ET TRANSPARENCE
// ============================================
const CONFIDENCE_THRESHOLDS = {
  EXCELLENT: 85,      // Donn?es compl?tes et v?rifi?es
  GOOD: 70,           // Donn?es suffisantes pour scoring fiable
  ACCEPTABLE: 60,     // Minimum pour afficher un score
  INSUFFICIENT: 0     // Donn?es insuffisantes - pas de score
};

const SCORING_WEIGHTS = {
  nova: 0.15,
  nutriScore: 0.20,
  additives: 0.15,
  sugars: 0.10,
  saturatedFat: 0.10,
  salt: 0.10,
  ecoScore: 0.15,
  labels: 0.05
};

function getSugarEquivalent(sugars) {
  if (!sugars || sugars === 0) return null;
  const morceaux = Math.round(sugars / 5);
  return morceaux + ' morceau' + (morceaux > 1 ? 'x' : '') + ' de sucre';
}

function getFatEquivalent(saturatedFat) {
  if (!saturatedFat || saturatedFat === 0) return null;
  const cuilleres = Math.round(saturatedFat / 5);
  return cuilleres + ' cuillère' + (cuilleres > 1 ? 's' : '') + ' à café de beurre';
}

function getSaltEquivalent(salt) {
  if (!salt || salt === 0) return null;
  const pincees = Math.round(salt / 0.5);
  return pincees + ' pincée' + (pincees > 1 ? 's' : '') + ' de sel';
}

/**
 * Convertit les sucres en équivalent morceaux de sucre
 * @param {number} sugars - Sucres en g/100g
 * @returns {string|null} - Équivalent en morceaux
 */


/**
 * Convertit les graisses saturées en équivalent cuillères de beurre
 * @param {number} saturatedFat - Graisses saturées en g/100g
 * @returns {string|null} - Équivalent en cuillères
 */


/**
 * Convertit le sel en équivalent pincées
 * @param {number} salt - Sel en g/100g
 * @returns {string|null} - Équivalent en pincées
 */


const REQUIRED_FIELDS_FOR_FOOD = {
  critical: ['product_name', 'brands'],
  important: ['ingredients_text', 'nutriments'],
  optional: ['labels', 'categories', 'packaging']
};

// ============================================
// CALCUL DU NIVEAU DE CONFIANCE
// ============================================
function calculateDataConfidence(product, category = 'food') {
  if (!product) {
    return {
      confidence: 0,
      level: 'INSUFFICIENT',
      missingCritical: ['product_name', 'brands'],
      missingImportant: ['ingredients_text', 'nutriments'],
      availableData: []
    };
  }

  const required = REQUIRED_FIELDS_FOR_FOOD;
  let confidence = 0;
  let missingCritical = [];
  let missingImportant = [];
  let availableData = [];

  // V?rifier champs critiques (40 points)
  required.critical.forEach(field => {
    if (product[field] && product[field].length > 0) {
      confidence += 20;
      availableData.push(field);
    } else {
...
```

## 4. Product Model
```javascript
// backend/src/models/Product.js
const mongoose = require('mongoose');

const additiveSchema = new mongoose.Schema({
  tag: String,
  code: String,
  name: String,
  function: String,
  riskLevel: { type: String, enum: ['low', 'moderate', 'high', 'LOW', 'MODERATE', 'HIGH', 'MEDIUM'],
    default: 'LOW'
  },
  healthConcerns: [String],
  origin: String
}, { _id: false });

const allergenSchema = new mongoose.Schema({
  tag: String,
  name: String,
  category: String,
  riskLevel: { type: String, enum: ['low', 'moderate', 'high', 'LOW', 'MODERATE', 'HIGH', 'MEDIUM'],
    default: 'MEDIUM'
  },
  description: String,
  concerns: [String],
  icon: String
}, { _id: false });

const nutritionSchema = new mongoose.Schema({
  energy: Number,
  fat: Number,
  saturatedFat: Number,
  carbohydrates: Number,
  sugars: Number,
  fiber: Number,
  protein: Number,
  salt: Number
}, { _id: false });

const cosmeticIngredientSchema = new mongoose.Schema({
  inci: String,
  function: String,
  origin: {
    type: String,
    enum: ['a-plus', 'a', 'b', 'c', 'd', 'e', 'unknown']
  },
  concerns: [String],
  isEndocrineDisruptor: { type: Boolean, default: false }
}, { _id: false });

const productSchema = new mongoose.Schema({
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  category: { type: String, enum: ['food', 'cosmetics', 'detergents', 'supplements', 'household', 'FOOD', 'COSMETICS']
  },
  subcategory: {
    type: String,
    index: true
  },
  imageUrl: String,

  foodData: {
    ingredients: String,
    ingredientsParsed: mongoose.Schema.Types.Mixed,
    additives: [additiveSchema],
    allergens: [allergenSchema],  // ? Modifi? en objets
    labels: [String],
    nutritionalInfo: nutritionSchema,
    novaGroup: { type: Number, min: 1, max: 4 },
    nutriScore: { type: String, enum: ['a', 'b', 'c', 'd', 'e', 'A', 'B', 'C', 'D', 'E', 'unknown'] },
    ecoScore: { type: String, enum: ['a-plus', 'a', 'b', 'c', 'd', 'e', 'unknown', 'A-PLUS', 'A', 'B', 'C', 'D', 'E', 'UNKNOWN'] }
  },

  cosmeticsData: {
    inciList: String,
    ingredients: [cosmeticIngredientSchema],
    endocrineDisruptors: [String],
    allergens: [String],
    certifications: [String]
  },

  detergentsData: {
    composition: [String],
    surfactants: [String],
    phosphateFree: Boolean,
    biodegradable: Boolean,
    ecoLabels: [String]
  },

  // Scores scientifiques (Calculate Once, Store Forever)
  scores: {
    overallScore: { type: Number, min: 0, max: 100, index: true },
    healthScore: { type: Number, min: 0, max: 100 },
    environmentScore: { type: Number, min: 0, max: 100 },
    confidence: Number,
    dataCompleteness: String,
    calculatedAt: { type: Date, default: Date.now },
    scoringVersion: { type: String, default: '3.0.0' },
    breakdown: mongoose.Schema.Types.Mixed,
    missingData: [String],
    aiEstimations: mongoose.Schema.Types.Mixed,
    aiEnrichmentUsed: { type: Boolean, default: false },
    aiEnrichmentSource: String,
    aiEnrichmentError: String,
    // Champs plats v3.1.0 (workaround Mongoose)
    scoringMetadata: mongoose.Schema.Types.Mixed,
    dataQualityInfo: mongoose.Schema.Types.Mixed
  },

  analysisData: {
    healthScore: { type: Number, min: 0, max: 100 },
    lastAnalyzedAt: Date,
    version: String,
    confidence: Number
  },

  viewCount: { type: Number, default: 0 },
  scanCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.index({ category: 1, 'analysisData.healthScore': -1 });
productSchema.index({ name: 'text', brand: 'text' });

productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

productSchema.methods.incrementView = async function() {
  this.viewCount++;
  return this.save();
};

productSchema.methods.getPublicData = function() {
  return this.toObject();
};

productSchema.statics.findByBarcode = function(barcode) {
  return this.findOne({ barcode });
};

productSchema.statics.searchProducts = async function(query, category = null) {
  const searchCriteria = { $text: { $search: query } };
  if (category) searchCriteria.category = category;
  
  return this.find(searchCriteria)
    .select('-__v')
    .limit(20)
    .sort({ score: { $meta: 'textScore' } });
};


// ============================================================================
// MIDDLEWARE AUTO-CALCUL SCORES V3.0.0
// ============================================================================
const scoringUnified = require('../services/scoringUnified');

productSchema.pre('save', async function(next) {
  if (this.scores?.scoringVersion === '3.0.0' && this.scores?.overallScore) {
    return next();
  }
  
  try {
    let calculatedScores;
    
    if (this.category === 'food' || !this.category) {
      const nutritionalInfo = this.foodData?.nutritionalInfo || {};
      
      const scoringData = {
        novaGroup: this.nova_group || this.foodData?.novaGroup,
        nutriScore: this.nutriscore_grade || this.foodData?.nutriScore,
        ecoScore: this.ecoscore_grade || this.foodData?.ecoScore,
        additives: this.foodData?.additives?.map(a => a.code || a.tag || a) || this.additives_tags || [],
        labels: this.foodData?.labels || this.labels_tags || [],
        packaging: this.packaging,
        origin: this.origins,
        ingredients: this.ingredients_text || this.foodData?.ingredients,
        nutriments: {
          sugars_100g: nutritionalInfo.sugars,
          'saturated-fat_100g': nutritionalInfo.saturatedFat,
          salt_100g: nutritionalInfo.salt
        }
      };
      
      calculatedScores = scoringUnified.calculateFoodScores(scoringData);
    } 
    else if (this.category === 'cosmetics') {
      calculatedScores = scoringUnified.calculateCosmeticScores(this);
    } 
    else if (this.category === 'detergents') {
      calculatedScores = scoringUnified.calculateDetergentScores(this);
    }
    
    if (calculatedScores) {
      this.scores = {
        overallScore: calculatedScores.overallScore,
        healthScore: calculatedScores.healthScore,
        environmentScore: calculatedScores.environmentScore,
        breakdown: calculatedScores.breakdown,
        confidence: calculatedScores.confidence,
        dataCompleteness: calculatedScores.dataCompleteness,
        calculatedAt: new Date(),
        scoringVersion: '3.0.0'
      };
    }
  } catch (error) {
    console.error('[Middleware]', error.message);
  }
  
  next();
});
module.exports = mongoose.model('Product', productSchema);








```

## 5. package.json backend
```json
{
    "name": "ecolojia-backend",
    "version": "3.0.0",
    "description": "Backend ECOLOJIA V3",
    "main": "src/server.js",
    "scripts": {
        "start": "node src/main.js",
        "dev": "node -r dotenv/config src/main.js",
        "verify": "node -e \"console.log(\\\"backend verify: OK (M1 placeholder)\\\");\"",
        "test:db": "node scripts/test-db.js"
    },
    "dependencies": {
        "@google-cloud/vision": "^5.3.3",
        "@lemonsqueezy/lemonsqueezy.js": "^4.0.0",
        "@sentry/node": "^10.15.0",
        "@sentry/tracing": "^7.120.4",
        "@types/jspdf": "^1.3.3",
        "algoliasearch": "^4.25.2",
        "archiver": "^7.0.1",
        "axios": "^1.12.2",
        "bcryptjs": "^2.4.3",
        "compression": "^1.7.4",
        "cookie-parser": "^1.4.7",
        "cors": "^2.8.5",
        "crypto-js": "^4.2.0",
        "dotenv": "^16.4.5",
        "express": "^4.19.2",
        "express-mongo-sanitize": "^2.2.0",
        "express-rate-limit": "^7.5.1",
        "express-session": "^1.18.2",
        "express-validator": "^7.2.1",
        "helmet": "^7.2.0",
        "ioredis": "^5.4.1",
        "json2csv": "^6.0.0-alpha.2",
        "jsonwebtoken": "^9.0.2",
        "mongoose": "^8.5.3",
        "multer": "^1.4.5-lts.1",
        "passport": "^0.7.0",
        "passport-google-oauth20": "^2.0.0",
        "pdfkit": "^0.17.2",
        "rate-limit-redis": "^4.2.2",
        "sharp": "^0.34.4",
        "uuid": "^9.0.1",
        "winston": "^3.17.0",
        "winston-daily-rotate-file": "^5.0.0",
        "zod": "^4.1.9"
    },
    "devDependencies": {
        "nodemon": "^3.0.1"
    }
}

```

## 6. package.json frontend
```json
{
    "name": "ecolojia-frontend",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "lint": "eslint .",
        "format": "prettier --write .",
        "preview": "vite preview",
        "test": "vitest run",
        "test:ui": "vitest",
        "test:e2e": "playwright test",
        "type-check": "tsc --noEmit",
        "e2e": "playwright test",
        "verify": "npm run type-check && npm run build"
    },
    "dependencies": {
        "@ericblade/quagga2": "^1.8.4",
        "@hookform/resolvers": "^3.3.4",
        "@lemonsqueezy/lemonsqueezy.js": "^4.0.0",
        "@radix-ui/react-alert-dialog": "^1.0.5",
        "@radix-ui/react-dialog": "^1.0.5",
        "@radix-ui/react-dropdown-menu": "^2.0.6",
        "@radix-ui/react-label": "^2.0.2",
        "@radix-ui/react-select": "^2.0.0",
        "@radix-ui/react-slot": "^1.0.2",
        "@radix-ui/react-tabs": "^1.0.4",
        "@radix-ui/react-toast": "^1.1.5",
        "@sentry/react": "^10.15.0",
        "@sentry/tracing": "^7.120.4",
        "@tanstack/react-query": "^5.85.5",
        "@zxing/browser": "^0.1.5",
        "@zxing/library": "^0.21.3",
        "algoliasearch": "^4.22.0",
        "axios": "^1.11.0",
        "axios-retry": "^4.5.0",
        "chart.js": "^4.5.0",
        "class-variance-authority": "^0.7.0",
        "clsx": "^2.1.1",
        "date-fns": "^4.1.0",
        "framer-motion": "^10.18.0",
        "html2canvas": "^1.4.1",
        "html5-qrcode": "^2.3.8",
        "i18next": "^23.7.16",
        "jspdf": "^3.0.2",
        "jspdf-autotable": "^5.0.2",
        "lucide-react": "^0.303.0",
        "react": "^18.2.0",
        "react-chartjs-2": "^5.3.0",
        "react-dom": "^18.2.0",
        "react-hook-form": "^7.48.2",
        "react-hot-toast": "^2.6.0",
        "react-i18next": "^14.0.0",
        "react-instantsearch": "^7.5.0",
        "react-router-dom": "^6.21.1",
        "recharts": "^2.15.4",
        "tailwind-merge": "^2.2.0",
        "tailwindcss-animate": "^1.0.7",
        "workbox-window": "^7.0.0",
        "zod": "^3.22.4",
        "zustand": "^4.5.7"
    },
    "devDependencies": {
        "@playwright/test": "^1.54.2",
        "@testing-library/jest-dom": "^6.7.0",
        "@testing-library/react": "^14.3.1",
        "@testing-library/user-event": "^14.6.1",
        "@types/jest": "^30.0.0",
        "@types/jspdf": "^1.3.3",
        "@types/node": "^20.19.11",
        "@types/react": "^18.2.47",
        "@types/react-dom": "^18.2.18",
        "@typescript-eslint/eslint-plugin": "^6.17.0",
        "@typescript-eslint/parser": "^6.17.0",
        "@vitejs/plugin-react": "^4.2.1",
        "@vitest/ui": "^1.1.3",
        "autoprefixer": "^10.4.16",
        "eslint": "^8.56.0",
        "eslint-plugin-react-hooks": "^4.6.0",
        "eslint-plugin-react-refresh": "^0.4.5",
        "jsdom": "^23.2.0",
        "playwright": "^1.54.2",
        "postcss": "^8.4.31",
        "tailwindcss": "^3.3.3",
        "typescript": "^5.3.3",
        "typescript-eslint": "^8.45.0",
        "vite": "^5.0.11",
        "vite-plugin-pwa": "^0.17.5",
        "vite-tsconfig-paths": "^4.2.3",
        "vitest": "^1.6.1"
    }
}

```


# ✅ CORRECTIONS APPLIQUÉES (4 NOV 2025)

## Problème initial
❌ Bouton "Améliorer avec IA" → Score restait 50/100

## Corrections réussies

### 1. enrichCosmeticsProduct() - Sauvegarde en base ✅
**Fichier** : backend/src/services/aiEnrichment.service.js
**Lignes** : ~111-150

Ajouté :
```javascript
await Product.updateOne({ _id: product._id }, { $set: updateData });
console.log('[AI] ✅ Cosmétique sauvegardé en base');
```

### 2. enrichProductWithAI() - Recalcul du score ✅
**Fichier** : backend/src/services/aiEnrichment.service.js
**Lignes** : ~200-230

Ajouté :
```javascript
const scoringData = { category: freshProduct.category, ...freshProduct.toObject() };
const newScores = scoringUnified.calculateScores(scoringData);
await Product.updateOne({ _id: freshProduct._id }, { $set: { scores: newScores } });
```

### 3. ProductOrchestrator - Ne plus écraser le score ✅
**Fichier** : backend/src/services/ProductOrchestrator.js
**Lignes** : 86-93

Modifié :
```javascript
if (product && product.scores?.overallScore !== null && product.scores?.overallScore !== undefined) {
  console.log('[Orchestrator] Product found in DB with valid score:', barcode);
  return { product, source: 'DATABASE', cached: true };
}
```

## Résultat
✅ Cosmétiques : Score 50/100 → 68/100 après enrichissement
✅ Score persiste en base

## Tests de validation
```powershell
# Vérifier score en base
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false})); const p = await Product.findOne({barcode: '3274080003388'}); console.log('Score:', p.scores?.overallScore); console.log('Ingredients:', p.cosmeticsData?.ingredients?.length); process.exit(0); });"
```

Résultat attendu :
- Score: 68
- Ingredients: 21


# ❌ CE QUI RESTE À FAIRE

## CRITIQUE (2h)

### 1. Corriger enrichFoodProduct() (1h)
**Problème** : Ne sauvegarde pas en base

**Commande PowerShell** :
```powershell
Copy-Item "backend\src\services\aiEnrichment.service.js" "backend\src\services\aiEnrichment.service.BACKUP_FOOD_$(Get-Date -Format 'yyyyMMdd_HHmmss').js"

$content = Get-Content "backend\src\services\aiEnrichment.service.js" -Encoding UTF8 -Raw

$old = @'
    console.log("[AI] Raw response:", displayResponse());
    const parsed = parseAIResponseByCategory(response, 'food', missingFields);
    
    return {
      success: true,
      estimations: parsed,
      aiEnriched: true
    };
'@

$new = @'
    console.log("[AI] Raw response:", displayResponse());
    const parsed = parseAIResponseByCategory(response, 'food', missingFields);
    console.log('[DEBUG] Parsed food:', JSON.stringify(parsed, null, 2));
    
    if (parsed && Object.keys(parsed).length > 0) {
      const updateData = {};
      if (parsed.sugars !== undefined) updateData['foodData.nutritionalInfo.sugars'] = parsed.sugars;
      if (parsed.saturatedFat !== undefined) updateData['foodData.nutritionalInfo.saturatedFat'] = parsed.saturatedFat;
      if (parsed.salt !== undefined) updateData['foodData.nutritionalInfo.salt'] = parsed.salt;
      if (parsed.fiber !== undefined) updateData['foodData.nutritionalInfo.fiber'] = parsed.fiber;
      if (parsed.novaGroup !== undefined) updateData['foodData.novaGroup'] = parsed.novaGroup;
      updateData['metadata.lastEnriched'] = new Date();
      updateData['metadata.aiEnrichmentVersion'] = '3.3';
      
      await Product.updateOne({ _id: product._id }, { $set: updateData });
      console.log('[AI] ✅ Alimentaire sauvegardé en base');
    }
    
    return {
      success: true,
      estimations: parsed,
      aiEnriched: true
    };
'@

$content = $content.Replace($old, $new)
$content | Set-Content "backend\src\services\aiEnrichment.service.js" -Encoding UTF8 -NoNewline

Write-Host "✅ enrichFoodProduct corrigé" -ForegroundColor Green
```

### 2. Corriger enrichDetergentsProduct() (30 min)
**Même logique**

### 3. Tester 3 catégories (30 min)
```powershell
# Alimentaire
curl -X POST http://localhost:10000/api/scoring/3596710545742/ai-enrich

# Cosmétique
curl -X POST http://localhost:10000/api/scoring/3274080003388/ai-enrich

# Détergent
curl -X POST http://localhost:10000/api/scoring/[BARCODE]/ai-enrich
```


# 🍳 ROADMAP MODULE RECETTES IA (15h)

## Phase 1 : Model Recipe (2h)
- Créer backend/src/models/Recipe.js
- Schéma complet (scoring, ingrédients, steps, variantes)
- Index MongoDB optimisés

## Phase 2 : Stock Initial (3h)
- 20 recettes scientifiques
- 10 alimentaires (pain IG bas, gâteau sans sucre, etc.)
- 5 DIY cosmétiques
- 5 DIY détergents
- Sources EFSA/ANSES/OMS

## Phase 3 : Service IA Adaptation (4h)
- backend/src/services/recipeAI.service.js
- Fonction adaptRecipe(recipeId, userProfile)
- Substitutions intelligentes
- Recalcul scores

## Phase 4 : Routes API (2h)
- GET /api/recipes (liste + filtres)
- GET /api/recipes/:id (détail)
- POST /api/recipes/:id/adapt (adaptation IA - premium)

## Phase 5 : Frontend (4h)
- RecipeListPage.tsx
- RecipeDetailPage.tsx
- RecipeAdaptModal.tsx
- Intégration meal plan

---

# 📊 STATISTIQUES PROJET

## Backend
- Routes : 50 fichiers
- Services : 95 fichiers
- Models : 18 fichiers
- Total lignes : ~71923 lignes

## Frontend
- Pages : 49 fichiers
- Components : 140 fichiers
- Services : 53 fichiers
- Total lignes : ~58408 lignes

## Base de données
- Produits : ~10 000
- Utilisateurs : actifs
- Catégories : 3 (food, cosmetic, detergent)

---

# 🚀 PROCHAINE ACTION IMMÉDIATE

1. Corriger enrichFoodProduct() (1h)
2. Corriger enrichDetergentsProduct() (30 min)
3. Tester 3 catégories (30 min)
4. Ajouter toasts frontend (30 min)

**Total : 2h30 pour MVP 100% fonctionnel**

---

# 📞 COMMANDES UTILES

## Démarrage
```powershell
# Backend
cd backend
npm run dev

# Frontend (nouveau terminal)
cd frontend
npm run dev
```

## Tests enrichissement
```powershell
# Cosmétique (fonctionne ✅)
curl -X POST http://localhost:10000/api/scoring/3274080003388/ai-enrich

# Alimentaire (à corriger ❌)
curl -X POST http://localhost:10000/api/scoring/3596710545742/ai-enrich

# Vérifier en base
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false})); const p = await Product.findOne({barcode: '3274080003388'}); console.log('Score:', p.scores?.overallScore); console.log('Confidence:', p.scores?.confidence); console.log('Ingredients:', p.cosmeticsData?.ingredients?.length); process.exit(0); });"
```

---

**PACKAGE CRÉÉ LE** : 4 Novembre 2025, 19h30
**ENCODAGE** : UTF-8 sans BOM vérifié
**PRÊT POUR TRANSMISSION** : ✅