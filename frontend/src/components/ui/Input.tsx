import React from "react";
import { cn, DS } from "../../lib/designSystem";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-2.5 border transition-all",
          DS.radiusXs,
          DS.border,
          "focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] outline-none",
          error && "border-rose-300 focus:ring-rose-200 focus:border-rose-500",
          "disabled:bg-slate-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
