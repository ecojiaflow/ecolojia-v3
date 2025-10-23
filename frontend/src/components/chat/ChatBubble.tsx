export default function ChatBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  return (
    <div className={role === "user" ? "text-right" : ""}>
      <span className={`inline-block px-3 py-2 rounded ${role === "user" ? "bg-emerald-600 text-white" : "bg-gray-100"}`}>
        {content}
      </span>
    </div>
  );
}
