import { useState } from "react";

type Props = { userId: string };

export default function PremiumCTA({ userId }: Props) {
  const [loading, setLoading] = useState(false);
  const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED !== "false";

  const goPremium = async () => {
    if (!paymentsEnabled) return; // prod off
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/payments/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (json?.success && json?.checkoutUrl) {
        window.location.href = json.checkoutUrl;
      } else {
        alert("Checkout indisponible.");
        console.error(json);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={goPremium}
      disabled={loading || !paymentsEnabled}
      title={paymentsEnabled ? "" : "Bientôt disponible"}
      className="btn btn-primary"
    >
      {loading ? "Ouverture du checkout..." : "Passer Premium (€4.99/mois)"}
    </button>
  );
}
