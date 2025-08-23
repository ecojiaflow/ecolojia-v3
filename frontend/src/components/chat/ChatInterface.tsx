import { useState } from "react";
import { useAIChat } from "../../hooks/useAIChat";
import ChatBubble from "./ChatBubble";

export default function ChatInterface({ context }: { context?: any }) {
  const chat = useAIChat(context);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)}>??</button>
      {open && (
        <div className="chat-panel">
          <div className="font-medium mb-2">Assistant IA</div>
          <div className="space-y-2 max-h-[40vh] overflow-auto">
            {chat.messages.map((m, i) => <ChatBubble key={i} role={m.role} content={m.content} />)}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem("q") as HTMLInputElement;
              const v = input.value.trim(); if (!v || chat.busy) return;
              chat.ask(v); input.value = "";
            }}
          >
            <input name="q" className="flex-1 border rounded px-3 py-2" placeholder="Posez votre question�" />
            <button className="bg-emerald-600 text-white rounded px-3 py-2" disabled={chat.busy}>Envoyer</button>
          </form>
        </div>
      )}
    </>
  );
}
