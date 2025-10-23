import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type Props = {
  onDetected: (code: string) => void;
  onCancel?: () => void;
  className?: string;
};

const BarcodeScannerPro: React.FC<Props> = ({
  onDetected,
  onCancel,
  className = "",
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<string>("Initialisation...");
  const [error, setError] = useState<string | null>(null);
  const hasDetectedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const scannerId = "barcode-scanner-pro";
    let cleanupDone = false;

    const startScanner = async () => {
      try {
        console.log("📷 Démarrage scanner html5-qrcode");
        
        // Créer instance
        const scanner = new Html5Qrcode(scannerId, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
          ],
        });
        
        scannerRef.current = scanner;

        // Configuration simplifiée et robuste
        const config = {
          fps: 10, // Réduit pour stabilité mobile
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777778,
        };

        // Callback succès
        const onSuccess = (decodedText: string) => {
          // Éviter détections multiples
          if (hasDetectedRef.current || !isMountedRef.current) return;

          console.log("✅ Code détecté:", decodedText);

          // Valider format
          if (/^\d{8,13}$/.test(decodedText)) {
            hasDetectedRef.current = true;
            setStatus("✓ Code validé !");
            
            // Arrêter scanner proprement
            if (scannerRef.current?.isScanning) {
              scannerRef.current.stop().catch(console.error);
            }
            
            // Appeler callback
            setTimeout(() => {
              if (isMountedRef.current) {
                onDetected(decodedText);
              }
            }, 100);
          }
        };

        // Callback erreur (ignoré silencieusement)
        const onError = () => {
          // Normal - appelé à chaque frame sans code
        };

        // Démarrer
        await scanner.start(
          { facingMode: "environment" },
          config,
          onSuccess,
          onError
        );

        if (isMountedRef.current) {
          setStatus("Scanner actif");
          console.log("✅ Scanner opérationnel");
        }

      } catch (err: any) {
        console.error("❌ Erreur scanner:", err);
        
        if (isMountedRef.current) {
          let msg = "Erreur caméra";
          
          if (err.name === "NotAllowedError") {
            msg = "Autorisez l'accès caméra";
          } else if (err.name === "NotFoundError") {
            msg = "Aucune caméra détectée";
          } else if (err.name === "NotReadableError") {
            msg = "Caméra déjà utilisée";
          }
          
          setError(msg);
          setStatus("Erreur");
        }
      }
    };

    startScanner();

    // Cleanup robuste
    return () => {
      isMountedRef.current = false;
      
      if (!cleanupDone && scannerRef.current) {
        cleanupDone = true;
        
        const scanner = scannerRef.current;
        
        // Vérifier état avant stop
        if (scanner.isScanning) {
          scanner
            .stop()
            .then(() => {
              console.log("🛑 Scanner arrêté");
              scanner.clear();
            })
            .catch(() => {
              // Ignorer erreurs cleanup
            });
        }
      }
    };
  }, [onDetected]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Container scanner */}
      <div className="relative w-full bg-black rounded-xl overflow-hidden">
        <div
          id="barcode-scanner-pro"
          className="w-full"
          style={{ minHeight: "340px" }}
        />

        {/* Overlay succès */}
        {hasDetectedRef.current && (
          <div className="absolute inset-0 bg-emerald-500/95 flex items-center justify-center z-50">
            <div className="text-white text-center">
              <div className="text-6xl mb-2">✓</div>
              <div className="text-xl font-bold">Code validé</div>
            </div>
          </div>
        )}

        {/* Cadre de visée */}
        {!hasDetectedRef.current && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="border-4 border-emerald-400 rounded-lg w-64 h-32 relative">
              {/* Coins */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white"></div>
              
              {/* Ligne scan */}
              <div 
                className="absolute w-full h-0.5 bg-emerald-300"
                style={{
                  top: "50%",
                  animation: "scan 2s ease-in-out infinite",
                  boxShadow: "0 0 8px rgba(52, 211, 153, 0.8)"
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Statut */}
      <div className={`rounded-lg p-3 text-sm ${
        error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"
      }`}>
        <div className="flex items-center gap-2">
          {!error && !hasDetectedRef.current && (
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          )}
          <span className="font-medium">{status}</span>
        </div>
      </div>

      {/* Erreur détaillée */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-900 font-medium mb-2">Problème détecté</p>
          <p className="text-red-700 text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-red-600 underline hover:text-red-800"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Instructions */}
      {!error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-900 mb-1">
            Instructions :
          </p>
          <ul className="text-xs text-blue-800 space-y-0.5">
            <li>• Placez le code-barres dans le cadre vert</li>
            <li>• Distance : 10-15 cm de la caméra</li>
            <li>• Bon éclairage, évitez les reflets</li>
          </ul>
        </div>
      )}

      {/* Bouton annuler */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Utiliser la saisie manuelle
        </button>
      )}

      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScannerPro;