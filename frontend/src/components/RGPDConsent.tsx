import { useState, useEffect } from 'react';

export function RGPDConsent() {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const consent = localStorage.getItem('rgpd-consent');
    if (!consent) setShow(true);
  }, []);
  
  const accept = () => {
    localStorage.setItem('rgpd-consent', 'true');
    setShow(false);
  };
  
  if (!show) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#1f2937',
      color: 'white',
      padding: '1rem',
      zIndex: 9999,
      textAlign: 'center'
    }}>
      <p style={{ margin: '0 0 0.5rem 0' }}>
        Nous utilisons des cookies pour améliorer votre expérience.
      </p>
      <button onClick={accept} style={{
        background: '#10b981',
        color: 'white',
        padding: '0.5rem 1.5rem',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}>
        Accepter
      </button>
    </div>
  );
}
