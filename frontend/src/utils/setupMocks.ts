// PATH: src/utils/setupMocks.ts
/**
 * Mocks opt‑in : activés SEULEMENT si VITE_MOCKS === '1'
 * - Par défaut: n'altère PAS window.fetch
 * - Si activé: on peut renvoyer des réponses simulées
 */

type FetchType = typeof fetch;
let originalFetch: FetchType | null = null;

export function enableMocks() {
  const enabled = (import.meta as any)?.env?.VITE_MOCKS === '1';
  if (!enabled) {
    // Pas de mocks -> on ne touche à rien
    return;
  }

  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  if (originalFetch) return; // déjà activé

  originalFetch = window.fetch;

  console.warn('[setupMocks] Mocks ENABLED (VITE_MOCKS=1). API calls may be stubbed.');

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    // Exemple de stub si besoin (désactivé par défaut) :
    // if (url.includes('/api/algolia/search')) {
    //   return new Response(JSON.stringify({ products: [] }), {
    //     status: 200,
    //     headers: { 'Content-Type': 'application/json' },
    //   });
    // }

    // Par défaut : on laisse passer VERS LE RÉEL (proxy Vite / Netlify)
    return originalFetch!(input as any, init);
  };
}

export function disableMocks() {
  if (originalFetch && typeof window !== 'undefined') {
    window.fetch = originalFetch;
    originalFetch = null;
    console.warn('[setupMocks] Mocks DISABLED (restored native fetch).');
  }
}
