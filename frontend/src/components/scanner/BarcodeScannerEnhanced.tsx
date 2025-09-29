import React, { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";
import { BrowserMultiFormatReader } from "@zxing/browser";

type Props = {
  onDetected: (code: string) => void;
  onCancel?: () => void;
  className?: string;
  defaultEngine?: "zxing" | "quagga";
};

const BarcodeScanner: React.FC<Props> = ({
  onDetected,
  onCancel,
  className = "",
  defaultEngine = "quagga", // QUAGGA EN DEFAULT (meilleur pour mobile)
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<"quagga" | "zxing">(defaultEngine);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Initialisation...");

  useEffect(() => {
    let mounted = true;
    let zxingReader: BrowserMultiFormatReader | null = null;
    let cleanupFn: (() => void) | null = null;

    const cleanup = () => {
      try {
        Quagga.stop();
        Quagga.offDetected();
        Quagga.offProcessed();
      } catch {}
      
      try {
        zxingReader?.reset();
      } catch {}
      
      if (ref.current) {
        ref.current.innerHTML = "";
      }
      
      if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
      }
    };

    const startQuagga = async () => {
      try {
        if (!ref.current) throw new Error("Container manquant");
        
        setStatus("Démarrage Quagga...");
        console.log("🔍 Initialisation Quagga");

        const videoContainer = document.createElement("div");
        videoContainer.id = "quagga-container";
        videoContainer.style.position = "relative";
        videoContainer.style.width = "100%";
        videoContainer.style.height = "100%";
        videoContainer.style.minHeight = "300px";
        ref.current.appendChild(videoContainer);

        await new Promise<void>((resolve, reject) => {
          Quagga.init(
            {
              inputStream: {
                name: "Live",
                type: "LiveStream",
                target: videoContainer,
                constraints: {
                  facingMode: "environment",
                  aspectRatio: { min: 1, max: 2 },
                  width: { min: 640, ideal: 1280, max: 1920 },
                  height: { min: 480, ideal: 720, max: 1080 },
                },
              },
              frequency: 10,
              locator: {
                patchSize: "medium",
                halfSample: true,
              },
              numOfWorkers: navigator.hardwareConcurrency || 4,
              decoder: {
                readers: [
                  "ean_reader",
                  "ean_8_reader",
                  "code_128_reader",
                  "code_39_reader",
                  "upc_reader",
                  "upc_e_reader",
                ],
                multiple: false,
              },
              locate: true,
            },
            (err) => {
              if (err) {
                console.error("❌ Quagga init error:", err);
                reject(err);
              } else {
                console.log("✅ Quagga initialisé");
                resolve();
              }
            }
          );
        });

        Quagga.start();
        setStatus("Scanner actif - Cadrez le code-barres");
        console.log("📷 Quagga démarré");

        let lastCode = "";
        let lastTime = 0;
        let consecutiveDetections = 0;

        Quagga.onDetected((result: any) => {
          if (!mounted || !isScanning) return;

          const code = result?.codeResult?.code;
          const now = Date.now();

          if (!code || code.length < 8) return;

          // Validation : même code détecté 2 fois pour éviter faux positifs
          if (code === lastCode && now - lastTime < 2000) {
            consecutiveDetections++;
            if (consecutiveDetections >= 2) {
              console.log("✅ Code validé:", code);
              setIsScanning(false);
              setStatus("Code détecté !");
              Quagga.stop();
              onDetected(code);
            }
          } else {
            consecutiveDetections = 1;
            lastCode = code;
            lastTime = now;
            console.log("🔍 Code détecté (validation...):", code);
          }
        });

      } catch (err: any) {
        console.error("❌ Erreur Quagga:", err?.message || err);
        setError(`Quagga: ${err?.message || "Erreur inconnue"}`);
        if (mounted) {
          setStatus("Basculement vers ZXing...");
          setTimeout(() => setEngine("zxing"), 1000);
        }
      }
    };

    const startZXing = async () => {
      try {
        if (!ref.current) throw new Error("Container manquant");

        setStatus("Démarrage ZXing...");
        console.log("🔍 Initialisation ZXing");

        zxingReader = new BrowserMultiFormatReader();

        const constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        const video = document.createElement("video");
        video.setAttribute("playsinline", "true");
        video.setAttribute("autoplay", "true");
        video.setAttribute("muted", "true");
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        video.srcObject = stream;

        ref.current.appendChild(video);
        await video.play();

        setStatus("Scanner actif - Cadrez le code-barres");
        console.log("📷 ZXing démarré");

        let scanning = true;
        cleanupFn = () => {
          scanning = false;
          stream.getTracks().forEach(track => track.stop());
        };

        // Boucle de scan optimisée
        const scan = async () => {
          if (!mounted || !isScanning || !scanning) return;

          try {
            const result = await zxingReader!.decodeOnce();
            if (result) {
              const code = result.getText();
              if (code && code.length >= 8) {
                console.log("✅ Code détecté:", code);
                setIsScanning(false);
                setStatus("Code détecté !");
                scanning = false;
                stream.getTracks().forEach(track => track.stop());
                onDetected(code);
                return;
              }
            }
          } catch {}

          if (scanning) {
            setTimeout(scan, 100);
          }
        };

        scan();

      } catch (err: any) {
        console.error("❌ Erreur ZXing:", err?.message || err);
        setError(`ZXing: ${err?.message || "Erreur inconnue"}`);
        if (mounted && engine === "zxing") {
          setStatus("Basculement vers Quagga...");
          setTimeout(() => setEngine("quagga"), 1000);
        }
      }
    };

    if (engine === "quagga") {
      startQuagga();
    } else {
      startZXing();
    }

    return () => {
      mounted = false;
      cleanup();
    };
  }, [engine, isScanning, onDetected]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className="w-full bg-black rounded-xl overflow-hidden relative"
        style={{ aspectRatio: "16/9", minHeight: 280 }}
        ref={ref}
      >
        {/* Overlay de cadrage */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="relative w-4/5 h-2/3 max-w-md">
            {/* Coins du cadre */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-emerald-400"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-emerald-400"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-emerald-400"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-emerald-400"></div>
            {/* Ligne de scan animée */}
            {isScanning && (
              <div className="absolute w-full h-0.5 bg-emerald-400 animate-pulse"
                   style={{ top: "50%", boxShadow: "0 0 10px rgba(52, 211, 153, 0.8)" }}>
              </div>
            )}
          </div>
        </div>

        {/* Message de confirmation */}
        {!isScanning && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="text-white text-center">
              <div className="text-5xl mb-2">✓</div>
              <div className="text-xl font-semibold">Code détecté !</div>
            </div>
          </div>
        )}
      </div>

      {/* Barre de statut */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <div className="flex items-center gap-2">
          {isScanning ? (
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          ) : (
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          )}
          <span className="text-gray-700">{status}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Contrôles */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          onClick={() => {
            setIsScanning(true);
            setError(null);
            setEngine(engine === "zxing" ? "quagga" : "zxing");
          }}
          disabled={!isScanning}
        >
          Changer moteur ({engine === "quagga" ? "→ ZXing" : "→ Quagga"})
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Annuler
          </button>
        )}

        <div className="ml-auto text-xs text-gray-500">
          Moteur actif: <span className="font-semibold">{engine.toUpperCase()}</span>
        </div>
      </div>

      {/* Astuces */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-900">
          <strong>💡 Conseils :</strong> Bonne lumière, tenir stable, cadrer le code dans le rectangle vert
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;