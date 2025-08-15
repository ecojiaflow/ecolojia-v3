// PATH: frontend/src/services/aiService.ts
import api from './apiClient';
export interface ChatMessage { role: 'user' | 'assistant' | 'system'; content: string; }
export interface ChatResponse { messages: ChatMessage[]; answer?: string; [k: string]: any; }
const AI_PATH = (import.meta as any)?.env?.VITE_AI_CHAT_PATH || '/api/ai/chat';
export async function askAI(messages: ChatMessage[]): Promise<ChatResponse> {
  const res = await api.post<ChatResponse>(AI_PATH, { messages });
  if (res?.answer && !res.messages) return { messages: [...messages, { role:'assistant', content: String(res.answer) }], ...res };
  return res;
}
export const aiService = { askAI };
export default aiService;
