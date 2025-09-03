// PATH: frontend/src/services/paymentService.ts
import api from './apiClient';

export type Plan = 'basic' | 'pro';
export interface CheckoutSession {
  url: string;
  id?: string;
  [k: string]: any;
}
export interface SubscriptionStatus {
  active: boolean;
  renewsAt?: string;
  plan?: Plan | string;
  trialEndsAt?: string;
  cancelAt?: string | null;
  [k: string]: any;
}

/**
 * Permet de surcharger les routes via variables d'env si besoin.
 * Laisse vide par defaut : on utilise les endpoints Render connus.
 */
const CHECKOUT_PATH =
  (import.meta as any)?.env?.VITE_PAYMENT_CHECKOUT_PATH ||
  '/api/payment/create-checkout';

const SUBSCRIPTION_PATHS = [
  (import.meta as any)?.env?.VITE_PAYMENT_SUBSCRIPTION_PATH || '/api/payment/subscription',
  '/api/payment/status', // fallback tolerant
];

const PORTAL_PATHS = [
  (import.meta as any)?.env?.VITE_PAYMENT_PORTAL_PATH || '/api/payment/portal',
  '/api/payment/customer-portal', // fallback eventuel
];

/**
 * Cree une session de paiement (LemonSqueezy via backend).
 * Renvoie { url }. Tu peux ensuite rediriger laâ‚¬â„¢utilisateur.
 */
export async function createCheckout(plan: Plan): Promise<CheckoutSession> {
  const cleanPlan = (String(plan || 'basic').toLowerCase() as Plan);
  const res = await api.post<CheckoutSession>(CHECKOUT_PATH, { plan: cleanPlan });
  if (!res || !res.url) {
    throw new Error('Le backend naâ‚¬â„¢a pas retourne daâ‚¬â„¢URL de paiement.');
  }
  return res;
}

/**
 * Ouvre la page de checkout dans un nouvel onglet (helper pratique).
 */
export async function openCheckout(plan: Plan): Promise<void> {
  const session = await createCheckout(plan);
  if (session?.url) {
    window.open(session.url, '_blank', 'noopener,noreferrer');
  } else {
    throw new Error('URL de checkout indisponible.');
  }
}

/**
 * Recupere laâ‚¬â„¢etat daâ‚¬â„¢abonnement. Essaie /subscription, puis /status.
 */
export async function getSubscription(): Promise<SubscriptionStatus> {
  let lastErr: any = null;
  for (const path of SUBSCRIPTION_PATHS) {
    try {
      const status = await api.get<SubscriptionStatus>(path);
      // Normalisation minimale
      return {
        active: Boolean(
          (status as any)?.active ??
          (status as any)?.isActive ??
          ((status as any)?.state === 'active')
        ),
        renewsAt: (status as any)?.renewsAt || (status as any)?.renews_at || (status as any)?.current_period_end,
        plan: (status as any)?.plan || (status as any)?.product || (status as any)?.price,
        trialEndsAt: (status as any)?.trialEndsAt || (status as any)?.trial_end,
        cancelAt: (status as any)?.cancelAt ?? (status as any)?.cancel_at ?? null,
        ...status,
      };
    } catch (e) {
      lastErr = e;
      // si 404 -> on tente le suivant
      const msg = String((e as Error)?.message || '');
      if (!msg.startsWith('HTTP 404')) break;
    }
  }
  // si on arrive ici : aucun chemin naâ‚¬â„¢a fonctionne
  throw new Error(
    `Impossible de recuperer laâ‚¬â„¢etat daâ‚¬â„¢abonnement (${String((lastErr as Error)?.message || 'inconnu')}).`
  );
}

/**
 * Recupere une URL de portail client (si le backend laâ‚¬â„¢expose), sinon leve une erreur explicite.
 * Utile pour gerer factures, cartes, annulationsaâ‚¬Â¦ (optionnel cote backend).
 */
export async function getPortalUrl(): Promise<string> {
  let lastErr: any = null;
  for (const path of PORTAL_PATHS) {
    try {
      const res = await api.get<{ url?: string }>(path);
      if (res?.url) return res.url;
      throw new Error('Le backend naâ‚¬â„¢a pas renvoye daâ‚¬â„¢URL de portail.');
    } catch (e) {
      lastErr = e;
      const msg = String((e as Error)?.message || '');
      if (!msg.startsWith('HTTP 404')) break;
    }
  }
  throw new Error(
    `Portail client indisponible (${String((lastErr as Error)?.message || 'inconnu')}).`
  );
}

/**
 * Helper pour ouvrir le portail client dans un nouvel onglet.
 */
export async function openPortal(): Promise<void> {
  const url = await getPortalUrl();
  window.open(url, '_blank', 'noopener,noreferrer');
}

export const paymentService = {
  createCheckout,
  openCheckout,
  getSubscription,
  getPortalUrl,
  openPortal,
};

export default paymentService;

