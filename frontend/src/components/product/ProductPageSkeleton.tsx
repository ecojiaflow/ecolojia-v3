/**
 * ProductPageSkeleton.tsx — Skeleton Loading (Polish V1)
 * 
 * Affiche un squelette animé pendant le chargement
 * Look premium, sensation app moderne
 * 
 * @version 1.0.0
 */

import React from "react";

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded-lg ${className || ""}`}
      style={{ animation: "pulse 1.5s ease-in-out infinite" }}
    />
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOPBAR */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <SkeletonPulse className="h-8 w-8 rounded-xl" />
          <SkeletonPulse className="h-4 w-24" />
          <SkeletonPulse className="h-8 w-8 rounded-xl" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4">
        
        {/* HERO Skeleton */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200">
          <SkeletonPulse className="h-16 w-16 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-5 w-3/4" />
            <SkeletonPulse className="h-4 w-1/2" />
          </div>
        </div>

        {/* DECISION BLOCK Skeleton */}
        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-3 w-3 rounded-full" />
            <SkeletonPulse className="h-4 w-48" />
          </div>
          <SkeletonPulse className="h-5 w-full" />
          <SkeletonPulse className="h-5 w-2/3" />
          <div className="flex gap-2 pt-2">
            <SkeletonPulse className="h-12 flex-1 rounded-xl" />
            <SkeletonPulse className="h-12 flex-1 rounded-xl" />
          </div>
        </div>

        {/* WHY THIS LEVEL Skeleton */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
          <SkeletonPulse className="h-4 w-36" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonPulse className="h-4 w-4" />
              <SkeletonPulse className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonPulse className="h-4 w-4" />
              <SkeletonPulse className="h-4 w-56" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonPulse className="h-4 w-4" />
              <SkeletonPulse className="h-4 w-40" />
            </div>
          </div>
        </div>

        {/* QUICK TAGS Skeleton */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
          <SkeletonPulse className="h-4 w-24" />
          <SkeletonPulse className="h-3 w-28" />
          <div className="flex gap-2">
            <SkeletonPulse className="h-7 w-20 rounded-full" />
            <SkeletonPulse className="h-7 w-24 rounded-full" />
            <SkeletonPulse className="h-7 w-20 rounded-full" />
          </div>
        </div>

        {/* ALTERNATIVES Skeleton */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <SkeletonPulse className="h-4 w-52" />
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                <SkeletonPulse className="h-11 w-11 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonPulse className="h-4 w-32" />
                  <SkeletonPulse className="h-3 w-20" />
                </div>
                <SkeletonPulse className="h-4 w-6" />
              </div>
            ))}
          </div>
        </div>

        {/* HABIT Skeleton */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 p-5">
          <div className="flex items-start gap-4">
            <SkeletonPulse className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-3 w-28" />
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-3 w-3/4" />
            </div>
          </div>
        </div>

        {/* DETAILS ACCORDION Skeleton */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <SkeletonPulse className="h-4 w-28" />
            <SkeletonPulse className="h-5 w-5" />
          </div>
        </div>

        {/* Spacer */}
        <div className="h-6" />
      </div>
    </div>
  );
}
