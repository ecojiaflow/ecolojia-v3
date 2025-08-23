import React from 'react';
import { ChatWidget } from '../components/chat/ChatWidget';

export default function TestChatPage() {
  // Contexte de test
  const testContext = {
    productName: "Produit Test",
    novaGroup: 4,
    healthScore: 45,
    additives: [
      { code: "E621", name: "Glutamate", riskLevel: "high" },
      { code: "E150d", name: "Caramel IV", riskLevel: "medium" }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-4">Test Chat Widget</h1>
      <p>Le bouton de chat devrait apparaître en bas à droite</p>
      
      {/* Widget avec contexte */}
      <ChatWidget productContext={testContext} />
    </div>
  );
}
