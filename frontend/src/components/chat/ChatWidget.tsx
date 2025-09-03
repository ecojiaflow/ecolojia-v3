// PATH: frontend/src/components/chat/ChatWidget.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { Button } from '../common/Button';
import { ProductContext } from '../../services/chat/ChatService';

interface ChatWidgetProps {
  productContexta: ProductContext;
  classNamea: string;
}

export function ChatWidget({ productContext, className = '' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    suggestions,
    isLoading,
    sendMessage,
    clearHistory
  } = useChat({ productContext });

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus sur l'input  l'ouverture
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Formater le contenu du message (convertir markdown basique)
  const formatMessageContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Gras
        line = line.replace(/\*\*(.*a)\*\*/g, '<strong>$1</strong>');
        // Bullet points
        if (line.trim().startsWith('')) {
          return <li key={index} className="ml-4" dangerouslySetInnerHTML={{ __html: line.substring(1).trim() }} />;
        }
        return <p key={index} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />;
      });
  };

  return (
    <>
      {/* Bouton flottant */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 right-6 w-14 h-14 bg-[#7DDE4A] rounded-full shadow-lg flex items-center justify-center hover:bg-[#6BCF3A] transition-colors ${className}`}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Widget de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-[#7DDE4A] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bot className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">Assistant ECOLOJIA</h3>
                  {productContext && (
                    <p className="text-sm text-white/80">
                       propos de {productContext.productName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearHistory}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  title="Effacer l'historique"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">
                     Je suis votre assistant nutritionnel ECOLOJIA !
                    {productContext && ` Posez-moi vos questions sur ${productContext.productName}.`}
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-[#7DDE4A] text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'ai' && (
                        <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm">
                          {message.type === 'user' ? (
                            message.content
                          ) : (
                            formatMessageContent(message.content)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions && suggestions.length > 0 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-500 mb-2">Suggestions :</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={isLoading}
                      className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Tapez votre message..."
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7DDE4A] disabled:opacity-50"
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="small"
                  disabled={!input.trim() || isLoading}
                  className="rounded-xl"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
