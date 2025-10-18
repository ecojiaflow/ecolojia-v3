import React, { useState } from 'react';
import { CreditCard, Loader2, Crown } from 'lucide-react';
import paymentsAPI from '../../services/payments/paymentsAPI';

interface CheckoutButtonProps {
  userId: string;
  userEmail: string;
  planId?: string;
  planName?: string;
  price?: number;
  currency?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: (checkoutUrl: string) => void;
  onError?: (error: string) => void;
  customData?: Record<string, any>;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  userId,
  userEmail,
  planId = 'premium',
  planName = 'ECOLOJIA Premium',
  price = 4.99,
  currency = 'EUR',
  disabled = false,
  className = '',
  children,
  onSuccess,
  onError,
  customData = {}
}) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!userId || !userEmail) {
      const error = 'Informations utilisateur manquantes';
      onError?.(error);
      return;
    }

    setLoading(true);

    try {
      console.log('Création session checkout pour:', userEmail);

      const checkoutData = await paymentsAPI.createCheckoutSession(
        userEmail,
        userId,
        {
          planId,
          planName,
          price,
          currency,
          source: 'checkout_button',
          timestamp: new Date().toISOString(),
          ...customData
        }
      );

      if (checkoutData.success && checkoutData.data.checkoutUrl) {
        console.log('Session créée, redirection vers:', checkoutData.data.checkoutUrl);
        
        onSuccess?.(checkoutData.data.checkoutUrl);
        
        // Redirection vers LemonSqueezy
        window.location.href = checkoutData.data.checkoutUrl;
      } else {
        throw new Error('URL de checkout non reçue');
      }

    } catch (error) {
      console.error('Erreur checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du checkout';
      onError?.(errorMessage);
      
      // Afficher une alerte utilisateur si pas de handler d'erreur
      if (!onError) {
        alert(`Erreur: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const baseClassName = `
    inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium 
    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
    hover:scale-105 active:scale-95
  `;

  const variantClassName = `
    bg-gradient-to-r from-blue-600 to-purple-600 text-white 
    hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl
  `;

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={`${baseClassName} ${variantClassName} ${className}`}
      type="button"
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={20} />
          <span>Redirection...</span>
        </>
      ) : (
        <>
          {children || (
            <>
              <Crown size={20} />
              <span>Passer à Premium</span>
              <span className="bg-white/20 px-2 py-1 rounded text-sm">
                {price}€/{currency === 'EUR' ? 'mois' : 'month'}
              </span>
            </>
          )}
        </>
      )}
    </button>
  );
};

export default CheckoutButton;