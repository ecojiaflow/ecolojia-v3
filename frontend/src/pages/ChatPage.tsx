import { useEffect, useState } from "react";
import { checkPremium } from "../utils/checkPremium";
import PremiumCTA from "../components/PremiumCTA";

const USER_ID = "dev-user-123"; // TODO: idem

export default function ChatPage() {
  const [premium, setPremium] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => setPremium(await checkPremium(USER_ID)))();
  }, []);

  if (premium === null) return <p>Chargement…</p>;
  if (!premium) return <PremiumCTA userId={USER_ID} />;

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <h1>Chat IA (réservé Premium)</h1>
      {/* … ton composant chat existant … */}
    </div>
  );
}
