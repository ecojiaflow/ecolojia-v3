export async function checkPremium(userId: string): Promise<boolean> {
  if (!userId) return false;
  const base = import.meta.env.VITE_API_BASE;
  const res = await fetch(`${base}/api/payments/check-premium/${userId}`, { credentials: "include" });
  const json = await res.json().catch(() => ({}));
  return !!json?.premium;
}
