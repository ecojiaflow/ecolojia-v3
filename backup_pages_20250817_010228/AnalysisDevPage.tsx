// PATH: frontend\src\pages\AnalysisDevPage.tsx
import React, { useState } from 'react';
import { Loader2, Send, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnalysisResultCard } from '@/components/AnalysisResultCard';
import { analysisAPI } from '@/lib/api/analysis';
import type { AnalysisResult, ManualAnalysisPayload } from '@/lib/api/analysis';

// Exemples prÃ©dÃ©finis pour tests rapides
const EXAMPLES = {
  food_nova4: {
    name: 'CÃ©rÃ©ales chocolat',
    category: 'food' as const,
    ingredients: 'CÃ©rÃ©ales (blÃ©, maÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯s), sucre, cacao maigre en poudre, sirop de glucose-fructose, huile de palme, sel, arÃ´me artificiel vanille, Ã©mulsifiant (lÃ©cithine de soja E322), vitamines (B1, B2, B3, B6, B9, B12), fer',
    brand: 'Test Brand'
  },
  food_nova1: {
    name: 'Pommes bio',
    category: 'food' as const,
    ingredients: 'Pommes biologiques',
    brand: 'Verger Bio'
  },
  cosmetics_risk: {
    name: 'CrÃ¨me visage anti-Ã¢ge',
    category: 'cosmetics' as const,
    ingredients: 'Aqua, Glycerin, Dimethicone, Cetearyl Alcohol, Parfum, Methylparaben, Propylparaben, BHT, Limonene, Linalool, Citral, CI 19140, CI 42090',
    brand: 'Beauty Lab'
  },
  cosmetics_clean: {
    name: 'Gel douche naturel',
    category: 'cosmetics' as const,
    ingredients: 'Aqua, Sodium Coco-Sulfate, Glycerin, Aloe Barbadensis Leaf Juice, Citric Acid, Sodium Benzoate, Potassium Sorbate',
    brand: 'Nature Care'
  },
  detergent_harsh: {
    name: 'DÃ©tergent surpuissant',
    category: 'detergents' as const,
    ingredients: '15-30% agents de blanchiment oxygÃ©nÃ©s, 5-15% tensioactifs anioniques, <5% tensioactifs non ioniques, phosphonates, parfums (Limonene)',
    brand: 'PowerClean'
  }
};

export const AnalysisDevPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  // Formulaire
  const [formData, setFormData] = useState<ManualAnalysisPayload>({
    name: '',
    category: 'food',
    ingredients: '',
    brand: ''
  });

  const [nutritionEnabled, setNutritionEnabled] = useState(false);
  const [nutritionData, setNutritionData] = useState({
    kcal: '',
    sugars: '',
    salt: '',
    fiber: '',
    protein: '',
    saturatedFat: ''
  });

  // Charger le statut du service au montage
  React.useEffect(() => {
    analysisAPI.getServiceStatus()
      .then(setServiceStatus)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: ManualAnalysisPayload = {
        ...formData,
        foodData: nutritionEnabled && formData.category === 'food' ? {
          nutrition: {
            kcal: nutritionData.kcal ? Number(nutritionData.kcal) : undefined,
            sugars: nutritionData.sugars ? Number(nutritionData.sugars) : undefined,
            salt: nutritionData.salt ? Number(nutritionData.salt) : undefined,
            fiber: nutritionData.fiber ? Number(nutritionData.fiber) : undefined,
            protein: nutritionData.protein ? Number(nutritionData.protein) : undefined,
            saturatedFat: nutritionData.saturatedFat ? Number(nutritionData.saturatedFat) : undefined,
          }
        } : undefined
      };

      const analysisResult = await analysisAPI.manualAnalyze(payload);
      setResult(analysisResult);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (key: keyof typeof EXAMPLES) => {
    const example = EXAMPLES[key];
    setFormData(example);
    setNutritionEnabled(false);
    setResult(null);
    setError(null);
  };

  const handlePing = async () => {
    try {
      const pong = await analysisAPI.ping();
      alert(`Ping OK: ${JSON.stringify(pong)}`);
    } catch (err) {
      alert('Ping Ã©chouÃ©');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Beaker className="w-8 h-8" />
          Test d'analyse manuelle
        </h1>
        <p className="text-gray-600 mt-2">
          Page de dÃ©veloppement pour tester le service d'analyse
        </p>
      </div>

      {/* Status bar */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Service:</span>
            <span className="font-mono text-sm">
              {serviceStatus?.service || 'N/A'}
            </span>
            {serviceStatus?.usingFallback && (
              <Badge variant="warning">Fallback</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handlePing}>
            Ping
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Analyse manuelle</h2>
          
          {/* Exemples rapides */}
          <div className="mb-4">
            <Label>Exemples rapides</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadExample('food_nova4')}
              >
                Food NOVA 4
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadExample('food_nova1')}
              >
                Food NOVA 1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadExample('cosmetics_risk')}
              >
                CosmÃ©tique risquÃ©
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadExample('cosmetics_clean')}
              >
                CosmÃ©tique clean
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadExample('detergent_harsh')}
              >
                DÃ©tergent agressif
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom du produit */}
            <div>
              <Label htmlFor="name">Nom du produit</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: CÃ©rÃ©ales chocolat"
                required
              />
            </div>

            {/* Marque */}
            <div>
              <Label htmlFor="brand">Marque (optionnel)</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Ex: NestlÃ©"
              />
            </div>

            {/* CatÃ©gorie */}
            <div>
              <Label>CatÃ©gorie</Label>
              <RadioGroup
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as any })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="food" id="food" />
                  <Label htmlFor="food">Alimentaire</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cosmetics" id="cosmetics" />
                  <Label htmlFor="cosmetics">CosmÃ©tique</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="detergents" id="detergents" />
                  <Label htmlFor="detergents">DÃ©tergent</Label>
                </div>
              </RadioGroup>
            </div>

            {/* IngrÃ©dients */}
            <div>
              <Label htmlFor="ingredients">IngrÃ©dients</Label>
              <Textarea
                id="ingredients"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                placeholder="Copiez-collez la liste des ingrÃ©dients..."
                rows={4}
                required
              />
            </div>

            {/* Nutrition (food uniquement) */}
            {formData.category === 'food' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="nutrition"
                    checked={nutritionEnabled}
                    onChange={(e) => setNutritionEnabled(e.target.checked)}
                  />
                  <Label htmlFor="nutrition">Ajouter les valeurs nutritionnelles</Label>
                </div>
                
                {nutritionEnabled && (
                  <div className="grid grid-cols-2 gap-3 ml-6">
                    <div>
                      <Label htmlFor="kcal">Calories (kcal)</Label>
                      <Input
                        id="kcal"
                        type="number"
                        value={nutritionData.kcal}
                        onChange={(e) => setNutritionData({ ...nutritionData, kcal: e.target.value })}
                        placeholder="380"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sugars">Sucres (g)</Label>
                      <Input
                        id="sugars"
                        type="number"
                        step="0.1"
                        value={nutritionData.sugars}
                        onChange={(e) => setNutritionData({ ...nutritionData, sugars: e.target.value })}
                        placeholder="24"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salt">Sel (g)</Label>
                      <Input
                        id="salt"
                        type="number"
                        step="0.01"
                        value={nutritionData.salt}
                        onChange={(e) => setNutritionData({ ...nutritionData, salt: e.target.value })}
                        placeholder="0.8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fiber">Fibres (g)</Label>
                      <Input
                        id="fiber"
                        type="number"
                        step="0.1"
                        value={nutritionData.fiber}
                        onChange={(e) => setNutritionData({ ...nutritionData, fiber: e.target.value })}
                        placeholder="6"
                      />
                    </div>
                    <div>
                      <Label htmlFor="protein">ProtÃ©ines (g)</Label>
                      <Input
                        id="protein"
                        type="number"
                        step="0.1"
                        value={nutritionData.protein}
                        onChange={(e) => setNutritionData({ ...nutritionData, protein: e.target.value })}
                        placeholder="9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="saturatedFat">Graisses saturÃ©es (g)</Label>
                      <Input
                        id="saturatedFat"
                        type="number"
                        step="0.1"
                        value={nutritionData.saturatedFat}
                        onChange={(e) => setNutritionData({ ...nutritionData, saturatedFat: e.target.value })}
                        placeholder="2.5"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bouton submit */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Analyser
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* RÃ©sultats */}
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <AnalysisResultCard
              result={result}
              productName={formData.name}
              productBrand={formData.brand}
              category={formData.category}
              showRawData={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

