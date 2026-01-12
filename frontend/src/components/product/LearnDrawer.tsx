import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { LearnCardFull } from "./LearnCard";

/**
 * LearnDrawer.tsx — Bottom Sheet pour Micro-fiches
 * Version: 1.0.0
 * 
 * Usage:
 * <LearnDrawer 
 *   isOpen={isOpen} 
 *   onClose={() => setIsOpen(false)} 
 *   cardId="glucides-et-sucres" 
 * />
 */

interface LearnDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:10000";

export const LearnDrawer: React.FC<LearnDrawerProps> = ({ isOpen, onClose, cardId }) => {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardHistory, setCardHistory] = useState<string[]>([]);

  // Fetch card data
  const fetchCard = useCallback(async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/learn/${id}`);
      const data = await response.json();
      
      if (data.success && data.card) {
        setCard(data.card);
      } else {
        setError("Fiche non trouvee");
      }
    } catch (err) {
      console.error("[LearnDrawer] Fetch error:", err);
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load card when cardId changes
  useEffect(() => {
    if (isOpen && cardId) {
      fetchCard(cardId);
      setCardHistory([cardId]);
    }
  }, [isOpen, cardId, fetchCard]);

  // Navigate to related card
  const handleNavigate = useCallback((newCardId: string) => {
    setCardHistory(prev => [...prev, newCardId]);
    fetchCard(newCardId);
  }, [fetchCard]);

  // Go back in history
  const handleBack = useCallback(() => {
    if (cardHistory.length > 1) {
      const newHistory = [...cardHistory];
      newHistory.pop();
      const previousCardId = newHistory[newHistory.length - 1];
      setCardHistory(newHistory);
      fetchCard(previousCardId);
    }
  }, [cardHistory, fetchCard]);

  // Close drawer
  const handleClose = useCallback(() => {
    setCard(null);
    setCardHistory([]);
    setError(null);
    onClose();
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Handle bar */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 pb-2">
              {cardHistory.length > 1 ? (
                <button
                  onClick={handleBack}
                  className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
                >
                  ← Retour
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {loading && (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center h-64 px-4">
                  <p className="text-gray-500 text-center">{error}</p>
                  <button
                    onClick={handleClose}
                    className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200"
                  >
                    Fermer
                  </button>
                </div>
              )}

              {!loading && !error && card && (
                <LearnCardFull
                  card={card}
                  onClose={handleClose}
                  onNavigate={handleNavigate}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LearnDrawer;
