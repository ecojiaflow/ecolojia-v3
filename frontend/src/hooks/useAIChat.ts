import { useState, useCallback } from "react";
import { sendChatMessage } from "../services/chatService";

export function useAIChat(context?: any) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Bonjour ?? Que souhaitez-vous savoir sur ce produit ?" }
  ]);
  const [busy, setBusy] = useState(false);

  const ask = useCallback(async (text: string) => {
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const res = await sendChatMessage(text, context);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } finally {
      setBusy(false);
    }
  }, [context]);

  return { messages, ask, busy };
}
