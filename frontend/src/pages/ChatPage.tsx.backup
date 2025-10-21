import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import chatService from '../services/chatService';
import { MessageCircle, Send, Loader, AlertTriangle } from 'lucide-react';

const ChatPage = () => {
  const [searchParams] = useSearchParams();
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
  
  useEffect(() => {
    if (productBarcode) {
      fetch(`${import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com'}/api/products/${productBarcode}`)
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
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
            <div className="text-center text-gray-500 mt-20">
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
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.isUrgent
                    ? 'bg-red-50 border-2 border-red-500 text-red-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.isUrgent && (
                  <div className="flex items-center gap-2 mb-2 font-bold">
                    <AlertTriangle className="w-5 h-5" />
                    URGENCE DÉTECTÉE
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">L'IA réfléchit...</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
              placeholder="Posez votre question..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
