/**
 * AnimatedSection.tsx — Wrapper animation (Polish V1)
 * 
 * Ajoute fade + slide à n'importe quelle section
 * Utilise framer-motion déjà installé
 * 
 * @version 1.0.0
 */

import React from "react";
import { motion } from "framer-motion";

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedSection({ 
  children, 
  delay = 0,
  className = ""
}: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: [0.25, 0.1, 0.25, 1] // ease-out cubic
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedList — Pour les listes avec stagger
 */
interface AnimatedListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function AnimatedList({
  children,
  staggerDelay = 0.05,
  className = ""
}: AnimatedListProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.25,
            delay: index * staggerDelay,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
