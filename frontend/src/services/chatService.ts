import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProductContext {
  name?: string;
  category?: string;
  novaGroup?: number;
  nutriScore?: string;
  overallScore?: number;
  additives?: any[];
  allergens?: string[];
}

interface ChatResponse {
  reply: string;
  isUrgent?: boolean;
  urgentType?: string;
}

class ChatService {
  private conversationHistory: ChatMessage[] = [];
  private currentProduct: string | null = null;
  
  async sendMessage(
    message: string, 
    productBarcode?: string,
    productContext?: ProductContext
  ): Promise<ChatResponse> {
    try {
      if (productBarcode && productBarcode !== this.currentProduct) {
        this.clearHistory();
        this.currentProduct = productBarcode;
      }
      
      this.conversationHistory.push({ role: 'user', content: message });
      
      const response = await axios.post<ChatResponse>(`${API_URL}/api/chat/deepseek`, {
        messages: this.conversationHistory,
        productContext
      });
      
      if (response.data.reply) {
        this.conversationHistory.push({
          role: 'assistant',
          content: response.data.reply
        });
      }
      
      return response.data;
      
    } catch (error) {
      console.error('[Chat Service]', error);
      throw new Error('Service chat temporairement indisponible');
    }
  }
  
  clearHistory() {
    this.conversationHistory = [];
    this.currentProduct = null;
  }
  
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }
}

export const chatService = new ChatService();
export default chatService;
