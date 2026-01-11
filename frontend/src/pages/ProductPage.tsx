/**
 * ProductPage.tsx — ECOLOJIA Mini-Spec V1 + Polish Pro FINAL
 *
 * FEATURES:
 * - Skeleton loading
 * - Micro-animations (fade/slide)
 * - Cards premium (shadow + hover)
 * - Sticky CTA mobile
 * - Transitions fluides
 *
 * @version 5.2.0 - Polish Pro Final
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

// Composants Mini-Spec V1
import { DecisionBlock } from "../components/product/DecisionBlock";
import { WhyThisLevel } from "../components/product/WhyThisLevel";
import { QuickTags } from "../components/product/QuickTags";
import { AlternativesSection } from "../components/product/AlternativesSection";
import { HabitCard } from "../components/product/HabitCard";
import { DetailsAccordionV2 } from "../components/product/DetailsAccordionV2";
import { ProductPageSkeleton } from "../components/product/ProductPageSkeleton";
import { StickyActionBar } from "../components/product/StickyActionBar";

// ============================================================================
// ANIMATION CONFIG
// ============================================================================
const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

// ============================================================================
// TYPES
// ============================================================================

type Level = 1 | 2 | 3;

interface HealthReflex {
  level: Level;
  levelLabel?: string | null;
  flags?: string[] | null;
  content?: string | null;
}

interface Habit {
  id?: string;
  title: string;
  description?: string;
}

interface Constitution {
  healthReflex?: HealthReflex;
  habit?: Habit;
}

interface Scores {
  overallScore?: number;
  healthScore?: number;
  environmentScore?: number;
}

interface NutritionData {
  sugars?: number;
  fat?: number;
  saturated_fat?: number;
  salt?: number;
  fiber?: number;
  proteins?: number;
}

interface FoodData {
  novaGroup?: number;
  nutriScore?: string;
  nutritionalInfo?: NutritionData;
}

interface Alternative {
  _id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  images?: { front?: string };
  scores?: { overallScore?: number };
}

interface Product {
  _id: string;
  name: string;
  brand?: string;
  barcode?: string;
  imageUrl?: string;
  images?: { front?: string };
  scores?: Scores;
  foodData?: FoodData;
  nutrition?: NutritionData;
  constitution?: Constitution;
}

// ============================================================================
// API
// ============================================================================

async function getJSON(endpoint: string) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:10000";
  const url = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;
  const r = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
  let data: any = null;
  try { data = await r.json(); } catch { data = null; }
  return { ok: r.ok, status: r.status, data };
}

// ============================================================================
// CARD WRAPPER — Style uniforme
// ============================================================================
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);

  // Fetch product
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      const res = await getJSON(`/api/products/${id}`);
      if (!alive) return;
      if (!res.ok) { setError("Produit introuvable"); setProduct(null); }
      else { setProduct(res.data?.product || res.data); }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  // Fetch alternatives
  useEffect(() => {
    if (!product?.barcode) return;
    let alive = true;
    (async () => {
      const res = await getJSON(`/api/products/${product.barcode}/alternatives`);
      if (!alive) return;
      if (res.ok && Array.isArray(res.data)) {
        setAlternatives(res.data);
      }
    })();
    return () => { alive = false; };
  }, [product?.barcode]);

  // Actions
  const onShare = useCallback(async () => {
    if (!product) return;
    if (navigator.share) { 
      try { await navigator.share({ title: product.name, url: window.location.href }); } catch {} 
    } else { 
      await navigator.clipboard.writeText(window.location.href); 
      toast.success("Lien copié !"); 
    }
  }, [product]);

  const onAddToList = useCallback(() => { 
    toast.success("Ajouté à ma liste ✓"); 
  }, []);

  const onAlternatives = useCallback(() => { 
    document.getElementById("alternatives-section")?.scrollIntoView({ behavior: "smooth" }); 
  }, []);

  const onSelectAlt = useCallback((altId: string) => { 
    nav(`/product/${altId}`); 
  }, [nav]);

  // ============================================================================
  // LOADING
  // ============================================================================
  if (loading) return <ProductPageSkeleton />;

  // ============================================================================
  // ERROR
  // ============================================================================
  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center p-4">
        <motion.div 
          {...fadeInUp}
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
        >
          <div className="text-5xl mb-4">😕</div>
          <div className="text-xl font-semibold text-slate-900">Produit introuvable</div>
          <div className="mt-2 text-sm text-slate-500">{error ?? "Ce produit n'existe pas."}</div>
          <button 
            onClick={() => nav("/search")} 
            className="mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            Rechercher un produit
          </button>
        </motion.div>
      </div>
    );
  }

  // ============================================================================
  // DATA EXTRACTION
  // ============================================================================
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
  const isBio = false;

  // ============================================================================
  // RENDER — Mini-Spec V1 + Polish Pro Final
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOPBAR */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => nav(-1)} 
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <span className="text-sm font-medium text-slate-600">Fiche produit</span>
          <button 
            onClick={onShare} 
            className="p-2 -mr-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <Share2 className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      <motion.div 
        className="mx-auto max-w-2xl px-4 py-5 space-y-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        
        {/* 1. HERO — Nom + Marque + Image */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 grid place-items-center">
                {imageUrl ? (
                  <img src={imageUrl} alt={product.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-2xl text-slate-300">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2">{product.name}</h1>
                {product.brand && <p className="text-sm text-slate-500 mt-0.5">{product.brand}</p>}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 2. BLOC DÉCISION */}
        <motion.div variants={fadeInUp}>
          <DecisionBlock
            level={level}
            levelLabel={levelLabel}
            reflex={reflexContent}
            onAlternatives={onAlternatives}
            onAddToList={onAddToList}
          />
        </motion.div>

        {/* 3. POURQUOI CE NIVEAU */}
        <motion.div variants={fadeInUp}>
          <Card className="p-5">
            <WhyThisLevel
              flags={flags}
              nova={nova}
              nutriScore={nutriScore}
            />
          </Card>
        </motion.div>

        {/* 4. À RETENIR */}
        <motion.div variants={fadeInUp}>
          <Card className="p-5">
            <QuickTags
              flags={flags}
              nova={nova}
              nutriScore={nutriScore}
              isBio={isBio}
            />
          </Card>
        </motion.div>

        {/* 5. ALTERNATIVES */}
        <motion.div variants={fadeInUp} id="alternatives-section">
          <Card className="p-5">
            <AlternativesSection
              alternatives={alternatives}
              onSelect={onSelectAlt}
            />
          </Card>
        </motion.div>

        {/* 6. HABITUDE ASSOCIÉE */}
        <motion.div variants={fadeInUp}>
          <HabitCard habit={habit} />
        </motion.div>

        {/* 7. DÉTAILS (accordéon) */}
        <motion.div variants={fadeInUp}>
          <Card>
            <DetailsAccordionV2
              score={scores?.overallScore}
              healthScore={scores?.healthScore}
              environmentScore={scores?.environmentScore}
              nova={nova}
              nutriScore={nutriScore}
              nutrition={nutritionData}
            />
          </Card>
        </motion.div>

        {/* Spacer pour sticky bar mobile */}
        <div className="h-24 sm:h-6" />
      </motion.div>

      {/* STICKY ACTION BAR (mobile only) */}
      <StickyActionBar 
        onAlternatives={onAlternatives}
        onAddToList={onAddToList}
      />
    </div>
  );
}
