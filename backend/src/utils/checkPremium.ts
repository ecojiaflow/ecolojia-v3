export async function checkPremium(userId: string): Promise<boolean> {
  const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED !== "false";
  const gatingEnabled = import.meta.env.VITE_PREMIUM_GATING !== "off";

  // Gating OFF ou paiements OFF => accès libre
  if (!gatingEnabled || !paymentsEnabled) return true;

  if (!userId) return false;
  const base = import.meta.env.VITE_API_BASE;
  const res = await fetch(`${base}/api/payments/check-premium/${userId}`, { credentials: "include" });
  const json = await res.json().catch(() => ({}));
  return !!json?.premium;
}
