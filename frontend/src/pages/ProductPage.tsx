/**
 * ProductPage.tsx — ECOLOJIA v5.6.0
 * + productContext depuis l'API (avec fallback frontend)
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { DecisionBlock } from "../components/product/DecisionBlock";
import { WhyThisLevel } from "../components/product/WhyThisLevel";
import { QuickTags } from "../components/product/QuickTags";
import { AlternativesSection } from "../components/product/AlternativesSection";
import { HabitCard } from "../components/product/HabitCard";
import { DetailsAccordionV2 } from "../components/product/DetailsAccordionV2";
import { ProductPageSkeleton } from "../components/product/ProductPageSkeleton";
import { StickyActionBar } from "../components/product/StickyActionBar";
import { ConsciousConsumption } from "../components/product/ConsciousConsumption";
import { NutritionContext } from "../components/product/NutritionContext";

import DailyBalanceCard from "../components/product/DailyBalanceCard";
import EnergyPeakCard from "../components/product/EnergyPeakCard";
import AdditivesCard from "../components/product/AdditivesCard";
import PremiumInsightsCard from "../components/product/PremiumInsightsCard";
import { premiumService } from "../services/premiumService";
import LearnCTA from "../components/product/LearnCTA";
import SignatureFooter from "../components/product/SignatureFooter";
import { useAuthContext } from "../Contexts/AuthContext";
import TakeawayCard from "../components/product/TakeawayCard";
import ReflexCard from "../components/product/ReflexCard";
import KeyNutrientsCard from "../components/product/KeyNutrientsCard";

const fadeInUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } };
const staggerContainer = { animate: { transition: { staggerChildren: 0.08 } } };

// Helper: determiner la place dans la semaine
const getWeeklyPlace = (level: number | null, nova: number | null): "base" | "regular" | "occasional" | "limit" | "context" => {
  if (level === 1) return "base";
  if (level === 2) return "limit";
  if (level === 3) return nova === 4 ? "limit" : "occasional";
  return "context";
};

// Helper: generer les reflexes selon la categorie ET le niveau
const getReflexData = (subcategory: string | undefined, level: number | null, nova: number | null) => {
  // Niveau 1 = Base quotidienne
  if (level === 1) {
    return {
      portion: "Selon ton appetit",
      doList: ["Aliment de base a integrer librement", "Varie les preparations"],
      avoidList: [],
      frequency: "Quotidien possible"
    };
  }
  
  // Niveau 2 = A limiter
  if (level === 2) {
    const isUltraProcessed = nova === 4;
    return {
      portion: "Portion moderee",
      doList: isUltraProcessed 
        ? ["Prefere une version moins transformee", "Lis les ingredients avant d'acheter"]
        : ["Consomme dans le cadre d'un repas equilibre"],
      avoidList: isUltraProcessed
        ? ["Usage quotidien", "Grandes quantites"]
        : ["Exces reguliers"],
      frequency: "A limiter (2-3x/semaine max)"
    };
  }
  
  // Niveau 3 = Plaisir occasionnel (par subcategory)
  const pleasureMap: Record<string, { portion: string; doList: string[]; avoidList: string[]; frequency: string }> = {
    "chocolate-spread": {
      portion: "1 tartine fine (15g)",
      doList: ["Accompagne d'un fruit ou yaourt nature", "Reserve aux moments plaisir"],
      avoidList: ["Cumul sucre (jus + tartine)", "Usage quotidien"],
      frequency: "Occasionnel (1-2x/semaine)"
    },
    "biscuit": {
      portion: "2-3 biscuits",
      doList: ["Prefere en fin de repas", "Accompagne d'eau ou the"],
      avoidList: ["Grignotage hors repas", "Paquet entier"],
      frequency: "Occasionnel"
    },
    "soda": {
      portion: "1 verre (200ml)",
      doList: ["Reserve aux occasions festives"],
      avoidList: ["Consommation quotidienne", "Grandes quantites"],
      frequency: "Exceptionnel"
    },
    "chips": {
      portion: "Une poignee (30g)",
      doList: ["Partage en convivialite", "Accompagne de crudites"],
      avoidList: ["Paquet seul", "Usage regulier"],
      frequency: "Occasionnel"
    },
    "candy": {
      portion: "2-3 bonbons",
      doList: ["Savoure lentement", "Reserve aux moments plaisir"],
      avoidList: ["Grignotage repete", "Grandes quantites"],
      frequency: "Occasionnel"
    },
    "ice-cream": {
      portion: "1 boule (60g)",
      doList: ["Savoure en dessert", "Prefere versions artisanales"],
      avoidList: ["Pot entier", "Usage quotidien"],
      frequency: "Occasionnel"
    },
    "default": {
      portion: "Portion raisonnable",
      doList: ["Savoure en conscience", "Integre dans un moment plaisir"],
      avoidList: ["Consommation excessive", "Usage quotidien"],
      frequency: "Occasionnel"
    }
  };
  
  return pleasureMap[subcategory || "default"] || pleasureMap["default"];
};

type Level = 1 | 2 | 3;
interface HealthReflex { level: Level; levelLabel?: string | null; flags?: string[] | null; content?: string | null; }
interface Habit { id?: string; title: string; description?: string; }
interface Constitution { healthReflex?: HealthReflex; habit?: Habit; }
interface Scores { overallScore?: number; healthScore?: number; environmentScore?: number; }
interface NutritionData { sugars?: number; fat?: number; saturated_fat?: number; saturatedFat?: number; salt?: number; fiber?: number; proteins?: number; }
interface FoodData { novaGroup?: number; nutriScore?: string; nutritionalInfo?: NutritionData; additives?: string[]; labels?: string[]; }
interface Alternative { _id: string; name: string; brand?: string; imageUrl?: string; images?: { front?: string }; scores?: { overallScore?: number }; }
interface ProductContextProfile { processingLevel: string; sugarLevel: string; saltLevel: string; satFatLevel: string; additivesLevel: string; packagingType: string; packagingConfidence: string; isOrganic: boolean; isRawAgricultural: boolean; surfaceConsumed: string | boolean; usageFrequency: string; riskProfiles: string[]; contextConfidence: string; }
interface Product { _id: string; name: string; brand?: string; barcode?: string; imageUrl?: string; images?: { front?: string }; scores?: Scores; foodData?: FoodData; nutrition?: NutritionData; constitution?: Constitution; subcategory?: string; tags?: string[]; labels?: string[]; additives_tags?: string[]; additives_extracted?: string[]; ingredients_text?: string; dataQuality?: { additivesSource?: string; additivesCount?: number }; }

async function getJSON(endpoint: string) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:10000";
  const url = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;
  const r = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
  let data: any = null;
  try { data = await r.json(); } catch { data = null; }
  return { ok: r.ok, status: r.status, data };
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>{children}</div>;
}

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;
  const getColor = (s: number) => {
    if (s >= 70) return { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" };
    if (s >= 50) return { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" };
    if (s >= 30) return { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-200" };
    return { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" };
  };
  const colors = getColor(score);
  return (
    <div className={`flex items-center justify-center w-11 h-11 rounded-full ${colors.bg} ${colors.text} ring-2 ${colors.ring} flex-shrink-0`}>
      <span className="text-sm font-bold">{score}</span>
    </div>
  );
}

// FALLBACK: Génération frontend si API ne retourne pas productContext
const PACKAGING_MAP: Record<string, string> = {
  'spread': 'glass', 'chocolate-spread': 'glass', 'nut-butter': 'glass', 'jam': 'glass', 'honey': 'glass', 'sauce': 'glass',
  'canned-vegetables': 'metal', 'seafood': 'metal', 'soup': 'metal',
  'beverage': 'plastic', 'soda': 'plastic', 'water': 'plastic', 'dairy': 'plastic', 'yogurt': 'plastic',
  'cereal': 'cardboard', 'biscuit': 'cardboard', 'pasta': 'cardboard', 'rice': 'cardboard', 'breakfast': 'cardboard', 'cracker': 'cardboard', 'cake': 'cardboard', 'legumes': 'cardboard',
  'milk': 'composite', 'chocolate': 'composite', 'chocolate-bar': 'composite',
  'snack': 'plastic', 'snack-salty': 'plastic', 'snack-sweet': 'plastic', 'snack_bar': 'plastic', 'chips': 'plastic', 'candy': 'plastic', 'bread': 'plastic', 'dessert': 'plastic', 'ready-meal': 'plastic', 'cheese': 'plastic', 'plant-based': 'plastic',
  'haircare': 'plastic', 'bodycare': 'plastic', 'skincare': 'plastic', 'laundry': 'plastic', 'dishwashing': 'plastic',
  'spice': 'glass', 'dried-fruit': 'plastic'
};
const PACKAGING_CONFIDENCE: Record<string, string> = {
  'spread': 'high', 'chocolate-spread': 'high', 'nut-butter': 'high', 'jam': 'high', 'canned-vegetables': 'high', 'seafood': 'high', 'soup': 'high', 'cereal': 'high', 'pasta': 'high', 'rice': 'high',
  'beverage': 'medium', 'dairy': 'medium', 'biscuit': 'medium', 'snack': 'medium', 'chocolate-bar': 'medium',
  'other': 'low', 'dessert': 'low', 'ready-meal': 'low'
};
const ULTRA_PROCESSED = ['biscuit', 'snack', 'chocolate-bar', 'chocolate-spread', 'spread', 'snack-salty', 'snack-sweet', 'snack_bar', 'chips', 'candy', 'ready-meal', 'cake', 'cracker', 'beverage', 'soda'];
const FREQUENT_USE = ['biscuit', 'cereal', 'spread', 'chocolate-spread', 'nut-butter', 'jam', 'dairy', 'beverage', 'bread', 'pasta', 'rice', 'snack', 'breakfast'];
const RAW_CATEGORIES = ['fruit', 'fruits', 'legume', 'legumes', 'vegetable', 'vegetables', 'oeuf', 'oeufs', 'dried-fruit'];
const ORGANIC_LABELS = ['bio', 'biologique', 'organic', 'ab', 'eu-organic', 'demeter'];

function generateContextFallback(product: Product): ProductContextProfile {
  const nova = product.foodData?.novaGroup;
  const nutrition = product.nutrition || product.foodData?.nutritionalInfo;
  const sugars = nutrition?.sugars;
  const salt = nutrition?.salt;
  const satFat = nutrition?.saturated_fat || nutrition?.saturatedFat;
  const subcategory = (product.subcategory || "").toLowerCase();
  const labels = [...(product.labels || []), ...(product.foodData?.labels || [])].map(l => l.toLowerCase());
  const isOrganic = ORGANIC_LABELS.some(o => labels.some(l => l.includes(o)) || (product.name || "").toLowerCase().includes(o));
  const isRaw = nova === 1 || RAW_CATEGORIES.some(c => subcategory.includes(c));
  const isFrequent = FREQUENT_USE.some(c => subcategory.includes(c));
  
  let processingLevel = "processed";
  if (nova === 1) processingLevel = "raw";
  else if (nova === 2) processingLevel = "minimally_processed";
  else if (nova === 3) processingLevel = "processed";
  else if (nova === 4) processingLevel = "ultra_processed";
  else if (ULTRA_PROCESSED.some(c => subcategory.includes(c))) processingLevel = "ultra_processed";
  
  const sugarLevel = sugars === undefined ? "unknown" : sugars <= 5 ? "low" : sugars <= 12.5 ? "medium" : "high";
  const saltLevel = salt === undefined ? "unknown" : salt <= 0.3 ? "low" : salt <= 1.5 ? "medium" : "high";
  const satFatLevel = satFat === undefined ? "unknown" : satFat <= 1.5 ? "low" : satFat <= 5 ? "medium" : "high";
  
  const additives = product.additives_extracted || product.additives_tags || product.foodData?.additives || [];
  const additivesLevel = additives.length === 0 ? "none" : additives.length <= 2 ? "low" : additives.length <= 5 ? "moderate" : "high";
  
  let packagingType = "unknown";
  let packagingConfidence = "low";
  for (const [cat, pkg] of Object.entries(PACKAGING_MAP)) {
    if (subcategory.includes(cat)) { packagingType = pkg; break; }
  }
  for (const [cat, conf] of Object.entries(PACKAGING_CONFIDENCE)) {
    if (subcategory.includes(cat)) { packagingConfidence = conf; break; }
  }
  
  const riskProfiles: string[] = [];
  if (sugarLevel === "high") riskProfiles.push("glycemic_variation");
  if (processingLevel === "ultra_processed") riskProfiles.push("palatability");
  if (sugarLevel === "high" && satFatLevel === "high") riskProfiles.push("palatability");
  if (isFrequent && (additivesLevel === "moderate" || additivesLevel === "high")) riskProfiles.push("repetition_exposure");
  if (packagingType === "plastic" && isFrequent && packagingConfidence !== "low") riskProfiles.push("packaging_migration");
  if (isRaw && !isOrganic) riskProfiles.push("pesticide_exposure");
  if (saltLevel === "high" || satFatLevel === "high") riskProfiles.push("nutritional_imbalance");
  
  return {
    processingLevel, sugarLevel, saltLevel, satFatLevel, additivesLevel, packagingType, packagingConfidence,
    isOrganic, isRawAgricultural: isRaw, surfaceConsumed: "not_applicable",
    usageFrequency: isFrequent ? "frequent" : "regular",
    riskProfiles: [...new Set(riskProfiles)],
    contextConfidence: sugarLevel !== "unknown" ? "high" : "medium"
  };
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [productContext, setProductContext] = useState<ProductContextProfile | null>(null);
  const [nutritionContext, setNutritionContext] = useState<any>(null);
  const [microInsights, setMicroInsights] = useState<any>(null);
  const [dailyBalance, setDailyBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { user } = useAuthContext();
  const isPremium = user?.subscription?.tier === 'premium';

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      const res = await getJSON(`/api/products/${id}`);
      if (!alive) return;
      if (!res.ok) {
        setError("Produit introuvable");
        setProduct(null);
        setProductContext(null);
      } else {
        // Récupérer product et productContext de l'API
        const productData = res.data?.product || res.data;
        const contextData = res.data?.productContext || null;
        const nutritionData = res.data?.nutritionContext || null;
        const microInsightsData = res.data?.microInsights || null;
        setProduct(productData);
        setProductContext(contextData);
        setNutritionContext(nutritionData);
        setMicroInsights(microInsightsData);
        const dailyBalanceData = res.data?.dailyBalance || null;
        const aiEnrichmentData = res.data?.aiEnrichment || null;
        console.log('[ProductPage] dailyBalance depuis API:', dailyBalanceData);
        setDailyBalance(dailyBalanceData);
        // Auto-enrichissement IA (pour tous)
        if (aiEnrichmentData && aiEnrichmentData.needsEnrichment) {
          setAiInsights(aiEnrichmentData);
        }
        
        // Log pour debug (à retirer en prod)
        if (contextData) {
          console.log('[ProductPage] productContext depuis API:', contextData.packagingType, '[' + contextData.packagingConfidence + ']');
          if (nutritionData) {
            console.log('[ProductPage] nutritionContext depuis API:', nutritionData.confidence);
          }
        } else {
          console.log('[ProductPage] productContext: fallback frontend');
        }
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!product?.barcode) return;
    let alive = true;
    (async () => {
      const res = await getJSON(`/api/products/${product.barcode}/alternatives`);
      if (!alive) return;
      if (res.ok && Array.isArray(res.data)) setAlternatives(res.data);
    })();
    return () => { alive = false; };
  }, [product?.barcode]);

  const onShare = useCallback(async () => { if (!product) return; if (navigator.share) { try { await navigator.share({ title: product.name, url: window.location.href }); } catch {} } else { await navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); } }, [product]);
  const onAddToList = useCallback(() => { toast.success("Ajouté à ma liste ✓"); }, []);
  const onAlternatives = useCallback(() => { document.getElementById("alternatives-section")?.scrollIntoView({ behavior: "smooth" }); }, []);
  const onSelectAlt = useCallback((altId: string) => { nav(`/product/${altId}`); }, [nav]);

  if (loading) return <ProductPageSkeleton />;
  if (error || !product) return (
    <div className="min-h-screen bg-slate-50 grid place-items-center p-4">
      <motion.div {...fadeInUp} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="text-5xl mb-4">😕</div>
        <div className="text-xl font-semibold text-slate-900">Produit introuvable</div>
        <div className="mt-2 text-sm text-slate-500">{error ?? "Ce produit n'existe pas."}</div>
        <button onClick={() => nav("/search")} className="mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all">Rechercher un produit</button>
      </motion.div>
    </div>
  );

  const { constitution, scores, foodData, nutrition } = product;
  const healthReflex = constitution?.healthReflex;
  const level = healthReflex?.level ?? null;
  const levelLabel = healthReflex?.levelLabel ?? null;
  const flags = healthReflex?.flags ?? [];
  const reflexContent = healthReflex?.content ?? null;
  const habit = constitution?.habit;
  const nova = foodData?.novaGroup ?? null;
  const nutriScore = foodData?.nutriScore ?? null;
  const nutritionData = nutrition || foodData?.nutritionalInfo || null;
  const imageUrl = product.imageUrl || product.images?.front;
  const isBio = (product.labels || []).some(l => l.toLowerCase().includes("bio"));
  const overallScore = scores?.overallScore;
  
  // Utiliser productContext de l'API, sinon fallback frontend
  const finalContext = productContext || generateContextFallback(product);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <button onClick={() => nav(-1)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"><ArrowLeft className="h-5 w-5 text-slate-700" /></button>
          <span className="text-sm font-medium text-slate-600">Fiche produit</span>
          <button onClick={onShare} className="p-2 -mr-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"><Share2 className="h-5 w-5 text-slate-600" /></button>
        </div>
      </div>
      <motion.div className="mx-auto max-w-2xl px-4 py-5 space-y-4" variants={staggerContainer} initial="initial" animate="animate">
        
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 grid place-items-center">
                {imageUrl ? <img src={imageUrl} alt={product.name} className="h-full w-full object-contain" /> : <span className="text-2xl text-slate-300">📦</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2">{product.name}</h1>
                {product.brand && <p className="text-sm text-slate-500 mt-0.5">{product.brand}</p>}
              </div>
              <ScoreBadge score={overallScore} />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <TakeawayCard 
            weeklyPlace={getWeeklyPlace(level, nova)}
            oneLiner={level === 1 ? "Aliment de base, a integrer sans hesiter." : level === 2 ? "A consommer avec moderation." : "Produit plaisir : OK ponctuellement, c'est la repetition qui compte."}
            keyPoint={flags?.[0] || (nova === 4 ? "Produit ultra-transforme" : undefined)}
          />
        </motion.div>
        
        <motion.div variants={fadeInUp}><Card className="p-5"><QuickTags flags={flags} nova={nova} nutriScore={nutriScore} isBio={isBio} /></Card></motion.div>
        <motion.div variants={fadeInUp} id="alternatives-section"><Card className="p-5"><AlternativesSection alternatives={alternatives} onSelect={onSelectAlt} /></Card></motion.div>
        
        
        {(product.additives_extracted?.length > 0 || product.additives_tags?.length > 0) && <motion.div variants={fadeInUp}><AdditivesCard additives={product.additives_extracted || product.additives_tags || []} source={product.dataQuality?.additivesSource} /></motion.div>}
          
          
          
          {/* Données estimées par IA (pour tous) */}
          {aiInsights && (
            <motion.div variants={fadeInUp}>
              <PremiumInsightsCard 
                estimatedData={aiInsights.estimatedData}
                knownData={aiInsights.knownData}
                disclaimer={aiInsights.disclaimer}
                generatedAt={aiInsights.generatedAt}
                processingTime={aiInsights.processingTime}
              />
            </motion.div>
          )}
          {dailyBalance?.platePosition && <motion.div variants={fadeInUp}><LearnCTA category={dailyBalance.platePosition.category} categoryLabel={dailyBalance.platePosition.label} emoji={dailyBalance.platePosition.emoji} /></motion.div>}
        <motion.div variants={fadeInUp}>
          {(() => {
            const reflexData = getReflexData(product.subcategory, level, nova);
            return (
              <ReflexCard 
                portionLabel={reflexData.portion}
                doList={reflexData.doList}
                avoidList={reflexData.avoidList}
                frequencyLabel={reflexData.frequency}
              />
            );
          })()}
        </motion.div>
        {nutritionData && (
          <motion.div variants={fadeInUp}>
            <KeyNutrientsCard 
              nutrients={nutritionData}
              portion={30}
              subcategory={product.subcategory}
            />
          </motion.div>
        )}
        
          <motion.div variants={fadeInUp}><SignatureFooter /></motion.div>
        
        <motion.div variants={fadeInUp}><Card><DetailsAccordionV2 score={scores?.overallScore} healthScore={scores?.healthScore} environmentScore={scores?.environmentScore} nova={nova} nutriScore={nutriScore} nutrition={nutritionData} /></Card></motion.div>
        <div className="h-24 sm:h-6" />
      </motion.div>
      <StickyActionBar onAlternatives={onAlternatives} onAddToList={onAddToList} />
    </div>
  );
}










































