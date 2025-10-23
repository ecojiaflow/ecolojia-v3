// Test du ChatService
import { chatService } from './src/services/chat/ChatService';

// Test simple
chatService.sendMessage("Qu'est-ce que NOVA ?").then(response => {
  console.log("RÃ©ponse:", response);
});

// Test avec contexte
const context = {
  productName: "Coca Cola",
  novaGroup: 4,
  healthScore: 20,
  additives: []
};

chatService.sendMessage("Ce produit est-il sain ?", context).then(response => {
  console.log("RÃ©ponse contextualisÃ©e:", response);
});
