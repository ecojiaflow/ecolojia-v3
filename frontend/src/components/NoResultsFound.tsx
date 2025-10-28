import React, { useState } from "react";
import { Search, Loader, ExternalLink } from "lucide-react";

interface NoResultsFoundProps {
  query: string;
  /** Callback declencheur de la recherche web/I?. */
  onEnrichRequesta: (query: string) => Promise<void>;
}

const NoResultsFound: React.FC<NoResultsFoundProps> = ({
  query,
  onEnrichRequest,
}) => {
  const [isEnriching, setIsEnriching] = useState(false);

  const handleEnrichClick = async () => {
    if (!onEnrichRequest || isEnriching) return;
    setIsEnriching(true);
    try {
      await onEnrichRequest(query);
    } catch (err) {
      console.error("Enrichissement echoue :", err);
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <section
      role="alert"
      aria-live="polite"
      className="text-center py-16 bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100"
    >
      <div className="max-w-md mx-auto">
        <Search className="h-16 w-16 text-gray-300 mx-auto mb-6" />

        <h3 className="text-xl font-semibold text-eco-text mb-4">
          Aucun resultat trouve
        </h3>

        {query && (
          <p className="text-eco-text/70 mb-6">
            Votre recherche <strong>a {query} a</strong> naaaaa donne aucun
            resultat dans notre base de donnees ecoresponsable.
          </p>
        )}

        {onEnrichRequest && (
          <div className="space-y-4">
            <p className="text-sm text-eco-text/60">
              aaa Vous pouvez lancer une recherche web intelligente :
            </p>

            <button
              type="button"
              onClick={handleEnrichClick}
              disabled={isEnriching}
              aria-busy={isEnriching}
              className="inline-flex items-center px-6 py-3 bg-eco-leaf hover:bg-eco-leaf/90 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {isEnriching ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Recherche en coursaa
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Rechercher sur le web
                </>
              )}
            </button>

            {isEnriching && (
              <div
                role="status"
                className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700"
              >
                aaa Notre IA explore le web pour trouver des alternatives
                ecoresponsablesaa
              </div>
            )}
          </div>
        )}

        <footer className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-neutral-700">
            Suggestions : essayez des mots-cles plus simples ou verifiez
            laaaaorthographe.
          </p>
        </footer>
      </div>
    </section>
  );
};

export default NoResultsFound;



