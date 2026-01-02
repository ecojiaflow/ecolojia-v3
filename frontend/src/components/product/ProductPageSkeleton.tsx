/**
 * ProductPageSkeleton.tsx — Loading state pro
 */

import React from "react";

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-slate-200/70",
        className
      )}
    />
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F3FBF6]">
      {/* Topbar */}
      <div className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur-xl border-[#E6F2EA]">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Bone className="h-9 w-9" />
          <Bone className="h-7 w-32" />
          <Bone className="h-9 w-9" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="rounded-[32px] border border-[#E6F2EA] bg-white p-6 lg:p-8">
          <div className="flex items-start gap-4">
            <Bone className="h-20 w-20 lg:h-24 lg:w-24 rounded-3xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Bone className="h-8 w-3/4" />
              <Bone className="h-5 w-1/3" />
              <Bone className="h-7 w-40 rounded-full" />
            </div>
          </div>
        </div>

        {/* Reflex Hero */}
        <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-6">
          <Bone className="h-6 w-48 mb-4" />
          <Bone className="h-8 w-full mb-2" />
          <Bone className="h-5 w-2/3 mb-6" />
          <div className="flex gap-3">
            <Bone className="h-12 flex-1 rounded-2xl" />
            <Bone className="h-12 flex-1 rounded-2xl" />
          </div>
        </div>

        {/* 3 Cards */}
        <div className="grid gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-[#E6F2EA] bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bone className="h-11 w-11 rounded-2xl" />
                <Bone className="h-5 w-32" />
              </div>
              <Bone className="h-4 w-full mb-2" />
              <Bone className="h-4 w-5/6" />
            </div>
          ))}
        </div>

        {/* Proof */}
        <div className="rounded-3xl border border-[#E6F2EA] bg-white p-6">
          <Bone className="h-5 w-48" />
        </div>
      </div>
    </div>
  );
}
