// src/utils/setupMocks.ts
// Mock les appels auth pour éviter les 404
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Intercepter les appels auth
    if (url.includes('/auth/me') || url.includes('/users/me')) {
      console.log('Auth endpoint mocked - returning null user');
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Passer les autres appels
    return originalFetch(input, init);
  };
}

export {};
