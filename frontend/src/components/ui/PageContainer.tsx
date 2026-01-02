import React from "react";
import { cn, DS } from "../../lib/designSystem";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export function PageContainer({ children, className, maxWidth = "lg" }: PageContainerProps) {
  const widths = {
    sm: "max-w-xl",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-full",
  };

  return (
    <div className={cn("min-h-screen", DS.bg)}>
      <div className={cn("mx-auto", widths[maxWidth], DS.containerPadding, "py-6", className)}>
        {children}
      </div>
    </div>
  );
}
