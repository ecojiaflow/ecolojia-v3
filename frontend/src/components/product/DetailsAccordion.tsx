/**
 * DetailsAccordion.tsx — Score breakdown replié
 */

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

interface DetailsAccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function DetailsAccordion({
  title,
  defaultOpen = false,
  children,
}: DetailsAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-3xl border border-[#E6F2EA] bg-white/90 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}
