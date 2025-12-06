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
    console.log("🔵 [Scanner] Composant monté");
    console.log("🔵 [Scanner] onDetected type:", typeof onDetected);
    console.log("🔵 [Scanner] onDetected défini:", !!onDetected);

    const scannerId = "barcode-scanner-pro";
    let cleanupDone = false;

    const startScanner = async () => {
      try {
        console.log("📷 [Scanner] Démarrage scanner html5-qrcode");

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

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777778,
        };

        const onSuccess = (decodedText: string) => {
          if (hasDetectedRef.current || !isMountedRef.current) {
            console.log("⚠️ [Scanner] Détection ignorée (déjà traité ou unmounted)");
            return;
          }

          console.log("✅ [Scanner] Code détecté:", decodedText);
          console.log("🔍 [Scanner] Validation format...");

          if (/^\d{8,13}$/.test(decodedText)) {
            console.log("✅ [Scanner] Format valide");
            hasDetectedRef.current = true;
            setStatus("✓ Code validé !");

            if (scannerRef.current?.isScanning) {
              console.log("🛑 [Scanner] Arrêt scanner...");
              scannerRef.current.stop().catch(console.error);
            }

            console.log("🔵 [Scanner] AVANT setTimeout - onDetected défini:", !!onDetected);
            
            setTimeout(() => {
              console.log("🔵 [Scanner] DANS setTimeout");
              console.log("🔵 [Scanner] isMountedRef.current:", isMountedRef.current);
              console.log("🔵 [Scanner] onDetected type:", typeof onDetected);
              
              if (isMountedRef.current) {
                console.log("🚀 [Scanner] APPEL onDetected avec code:", decodedText);
                try {
                  onDetected(decodedText);
                  console.log("✅ [Scanner] onDetected appelé avec succès");
                } catch (err) {
                  console.error("❌ [Scanner] Erreur dans onDetected:", err);
                }
              } else {
                console.log("⚠️ [Scanner] Composant unmounted, appel annulé");
              }
            }, 100);
          } else {
            console.log("❌ [Scanner] Format invalide:", decodedText);
          }
        };

        const onError = () => {
          // Silencieux - normal à chaque frame
        };

        await scanner.start(
          { facingMode: "environment" },
          config,
          onSuccess,
          onError
        );

        if (isMountedRef.current) {
          setStatus("Scanner actif");
          console.log("✅ [Scanner] Scanner opérationnel");
        }

      } catch (err: any) {
        console.error("❌ [Scanner] Erreur scanner:", err);

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

    return () => {
      console.log("🔵 [Scanner] Cleanup...");
      isMountedRef.current = false;

      if (!cleanupDone && scannerRef.current) {
        cleanupDone = true;
        const scanner = scannerRef.current;

        if (scanner.isScanning) {
          scanner
            .stop()
            .then(() => {
              console.log("🛑 [Scanner] Scanner arrêté");
              scanner.clear();
            })
            .catch(() => {});
        }
      }
    };
  }, [onDetected]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative w-full bg-black rounded-xl overflow-hidden">
        <div
          id="barcode-scanner-pro"
          className="w-full"
          style={{ minHeight: "340px" }}
        />

        {hasDetectedRef.current && (
          <div className="absolute inset-0 bg-emerald-500/95 flex items-center justify-center z-50">
            <div className="text-white text-center">
              <div className="text-6xl mb-2">✓</div>
              <div className="text-xl font-bold">Code validé</div>
            </div>
          </div>
        )}

        {!hasDetectedRef.current && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="border-4 border-emerald-400 rounded-lg w-64 h-32 relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white"></div>
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
