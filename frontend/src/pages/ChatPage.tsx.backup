import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import chatService from '../services/chatService';
import { MessageCircle, Send, Loader, AlertTriangle } from 'lucide-react';

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const productBarcode = searchParams.get('product');
  const prefilledQuestion = searchParams.get('q');
  
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    isUrgent?: boolean;
  }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const messageAlreadySent = useRef(false);
  
  useEffect(() => {
    if (productBarcode) {
      fetch(`${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL}'}/api/products/${productBarcode}`)
        .then(res => res.json())
        .then(data => setProduct(data.product))
        .catch(err => console.error('Erreur chargement produit:', err));
    }
  }, [productBarcode]);
  
  useEffect(() => {
    if (prefilledQuestion && product) {
      handleSendMessage(decodeURIComponent(prefilledQuestion));
    }
  }, [prefilledQuestion, product]);

  useEffect(() => {
    const navState = location.state;
    if (navState?.productContext && navState?.initialMessage) {
      if (messageAlreadySent.current) return;
      messageAlreadySent.current = true;
      setProduct(navState.productContext);
      setTimeout(() => {
        handleSendMessage(navState.initialMessage);
      }, 500);
    }
  }, []);
  
  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || input.trim();
    if (!messageToSend) return;
    
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setInput('');
    setLoading(true);
    
    try {
      const productContext = product ? {
        name: product.name,
        category: product.category,
        novaGroup: product.foodData?.novaGroup,
        nutriScore: product.foodData?.nutriScore,
        overallScore: product.scores?.overallScore,
        additives: product.foodData?.additives?.slice(0, 3),
        allergens: product.foodData?.allergens
      } : undefined;
      
      const response = await chatService.sendMessage(
        messageToSend,
        productBarcode || undefined,
        productContext
      );
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.reply,
        isUrgent: response.isUrgent
      }]);
      
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erreur lors de la communication avec le service IA.',
        isUrgent: false
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-neutral-0 rounded-xl shadow-3 h-[calc(100vh-8rem)] flex flex-col border border-neutral-300">
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white p-4 rounded-t-xl shadow-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Assistant IA Expert
            </h2>
            {product && (
              <p className="text-sm opacity-90 mt-1">
                Produit : {product.name}
              </p>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-neutral-600 mt-20">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Posez vos questions sur le produit ou la nutrition</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 shadow-2 ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-[#0E1A0D]'
                      : msg.isUrgent
                      ? 'bg-danger/10 border-2 border-danger text-danger'
                      : 'bg-neutral-100 text-neutral-900 border border-neutral-300'
                  }`}
                >
                  {msg.isUrgent && (
                    <div className="flex items-center gap-2 mb-2 font-bold">
                      <AlertTriangle className="w-5 h-5" />
                      URGENCE DETECTEE
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 rounded-lg p-4 flex items-center gap-2 shadow-2 border border-neutral-300">
                  <Loader className="w-4 h-4 animate-spin text-primary-600" />
                  <span className="text-sm text-neutral-600">IA en reflexion...</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-neutral-300 p-4 bg-neutral-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                placeholder="Posez votre question..."
                className="flex-1 border border-neutral-300 rounded-lg px-4 py-3 bg-neutral-0 focus:outline-none focus:ring-2 focus:ring-[#236D3E] focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className="h-11 px-6 bg-primary-500 text-[#0E1A0D] rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-2 transition-all"
              >
                <Send className="w-4 h-4" />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;