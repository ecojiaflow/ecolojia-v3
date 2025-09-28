import { useEffect, useState } from "react";
import PremiumCTA from "../components/PremiumCTA";
import { checkPremium } from "../utils/checkPremium";

const USER_ID = "dev-user-123"; // TODO: remplacer par l'id de l'utilisateur connecté

export default function PremiumPage() {
  const [premium, setPremium] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const ok = await checkPremium(USER_ID);
      setPremium(ok);
    })();
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Premium</h1>
      <p>Accède au Chat IA illimité, et au support prioritaire.</p>

      {premium === null && <p>Vérification de votre abonnement…</p>}
      {premium === false && <PremiumCTA userId={USER_ID} />}
      {premium === true && <p>Vous êtes Premium ✅</p>}
    </div>
  );
}
