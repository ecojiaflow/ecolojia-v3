// PATH: src/utils/setupMocks.ts
/**
 * Mocks optaâ‚¬'˜in : actives SEULEMENT si VITE_MOCKS === '1'
 * - Par defaut: n'altere PAS window.fetch
 * - Si active: on peut renvoyer des reponses simulees
 */

type FetchType = typeof fetch;
let originalFetch: FetchType | null = null;

export function enableMocks() {
  const enabled = (import.meta as any)?.env?.VITE_MOCKS === '1';
  if (!enabled) {
    // [Cleaned comment]
    return;
  }

  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  if (originalFetch) return; // [Cleaned comment]

  originalFetch = window.fetch;

  console.warn('[setupMocks] Mocks ENABLED (VITE_MOCKS=1). API calls may be stubbed.');

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    // Exemple de stub si besoin (desactive par defaut) :
    // if (url.includes('/api/algolia/search')) {
    //   return new Response(JSON.stringify({ products: [] }), {
    //     status: 200,
    //     headers: { 'Content-Type': 'application/json' },
    //   });
    // }

    // Par defaut : on laisse passer VERS LE R‰EL (proxy Vite / Netlify)
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


