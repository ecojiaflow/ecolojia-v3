import React, { useState } from "react";
import { Search, Loader, ExternalLink } from "lucide-react";

interface NoResultsFoundProps {
  query: string;
  /** Callback déclencheur de la recherche web/IA. */
  onEnrichRequest?: (query: string) => Promise<void>;
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
      console.error("Enrichissement échoué :", err);
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
          Aucun résultat trouvé
        </h3>

        {query && (
          <p className="text-eco-text/70 mb-6">
            Votre recherche <strong>« {query} »</strong> n’a donné aucun
            résultat dans notre base de données écoresponsable.
          </p>
        )}

        {onEnrichRequest && (
          <div className="space-y-4">
            <p className="text-sm text-eco-text/60">
              💡 Vous pouvez lancer une recherche web intelligente :
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
                  Recherche en cours…
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
                🤖 Notre IA explore le web pour trouver des alternatives
                écoresponsables…
              </div>
            )}
          </div>
        )}

        <footer className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Suggestions : essayez des mots-clés plus simples ou vérifiez
            l’orthographe.
          </p>
        </footer>
      </div>
    </section>
  );
};

export default NoResultsFound;
