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
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Initialisation...");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const scannerId = "barcode-scanner-pro";

    const startScanner = async () => {
      try {
        if (!mounted) return;

        setStatus("Démarrage du scanner...");
        console.log("📷 Initialisation scanner PRO");

        // Créer l'instance du scanner
        scannerRef.current = new Html5Qrcode(scannerId, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
        });

        // Configuration OPTIMALE (secret des apps pro)
        const config = {
          fps: 30, // 30 images/sec pour détection ultra-rapide
          qrbox: { width: 300, height: 150 }, // Zone de scan optimisée codes-barres
          aspectRatio: 1.777778, // 16:9 pour mobile
          disableFlip: false, // Permet scan même si code à l'envers
          videoConstraints: {
            facingMode: { ideal: "environment" },
            advanced: [
              { zoom: 2.0 }, // Zoom pour meilleure lecture
              { focusMode: "continuous" }, // Auto-focus continu
              { whiteBalanceMode: "continuous" },
            ],
          },
        };

        // Callback de succès
        const onScanSuccess = (decodedText: string, decodedResult: any) => {
          if (!mounted || !isScanning) return;

          console.log("✅ CODE DÉTECTÉ:", decodedText);
          console.log("📊 Format:", decodedResult?.result?.format?.formatName);

          // Validation : code-barres valide (8-13 caractères numériques)
          if (/^\d{8,13}$/.test(decodedText)) {
            setStatus("Code validé !");
            setIsScanning(false);
            
            // Arrêter le scanner
            if (scannerRef.current) {
              scannerRef.current.stop().catch(console.error);
            }
            
            // Callback avec délai pour UX fluide
            setTimeout(() => onDetected(decodedText), 300);
          } else {
            console.warn("⚠️ Code invalide ignoré:", decodedText);
          }
        };

        // Callback d'erreur (normal, appelé à chaque frame sans code)
        const onScanError = (errorMessage: string) => {
          // Ne rien faire - c'est normal de ne pas détecter à chaque frame
        };

        // Démarrer le scan avec la caméra arrière
        await scannerRef.current.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanError
        );

        if (mounted) {
          setIsScanning(true);
          setStatus("Scanner actif - Cadrez le code-barres");
          console.log("✅ Scanner démarré avec succès");
        }

      } catch (err: any) {
        console.error("❌ Erreur scanner:", err);
        
        if (mounted) {
          let errorMsg = "Erreur d'accès à la caméra";
          
          if (err.name === "NotAllowedError") {
            errorMsg = "Autorisez l'accès à la caméra pour scanner";
          } else if (err.name === "NotFoundError") {
            errorMsg = "Aucune caméra détectée sur cet appareil";
          } else if (err.name === "NotReadableError") {
            errorMsg = "Caméra utilisée par une autre application";
          }
          
          setError(errorMsg);
          setStatus("Erreur");
        }
      }
    };

    startScanner();

    // Cleanup
    return () => {
      mounted = false;
      
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            console.log("🛑 Scanner arrêté");
            scannerRef.current?.clear();
          })
          .catch(console.error);
      }
    };
  }, [onDetected]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Container du scanner */}
      <div className="relative w-full bg-black rounded-xl overflow-hidden">
        <div
          id="barcode-scanner-pro"
          ref={containerRef}
          className="w-full"
          style={{ minHeight: "320px" }}
        />

        {/* Overlay succès */}
        {!isScanning && !error && (
          <div className="absolute inset-0 bg-emerald-500/90 flex items-center justify-center z-50">
            <div className="text-white text-center p-6">
              <div className="text-6xl mb-3 animate-bounce">✓</div>
              <div className="text-2xl font-bold">Code détecté !</div>
              <div className="text-sm mt-2 opacity-90">Analyse en cours...</div>
            </div>
          </div>
        )}
      </div>

      {/* Barre de statut */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {isScanning && !error ? (
            <>
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute"></div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{status}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Maintenez le code-barres dans le cadre
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <p className="text-sm text-gray-700">{status}</p>
            </>
          )}
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 mb-1">Erreur</p>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs font-medium text-red-600 hover:text-red-800 underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conseils d'utilisation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-900 mb-2">💡 Conseils pour un scan rapide :</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Bonne luminosité (évitez les reflets)</li>
          <li>• Tenez le téléphone stable</li>
          <li>• Distance : 10-20 cm du code-barres</li>
          <li>• Le scan fonctionne même si le code est de travers</li>
        </ul>
      </div>

      {/* Bouton annuler */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Saisir manuellement
        </button>
      )}

      {/* Info technique */}
      <p className="text-xs text-center text-gray-500">
        Scanner professionnel • Détection multi-formats
      </p>
    </div>
  );
};

export default BarcodeScannerPro;