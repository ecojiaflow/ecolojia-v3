import React, { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";
import { BrowserMultiFormatReader } from "@zxing/browser";

type Props = {
  onDetected: (code: string) => void;
  onCancel?: () => void;
  className?: string;
  // "zxing" recommandé; "quagga" possible si tu veux tester
  defaultEngine?: "zxing" | "quagga";
};

const BarcodeScanner: React.FC<Props> = ({
  onDetected,
  onCancel,
  className = "",
  defaultEngine = "zxing",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<"quagga" | "zxing">(defaultEngine);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let zxingReader: BrowserMultiFormatReader | null = null;
    let stream: MediaStream | null = null;

    const cleanup = () => {
      // Stop Quagga
      try { Quagga.stop(); } catch {}
      // Reset ZXing
      try { zxingReader?.reset(); } catch {}
      // Stop camera
      try { stream?.getTracks().forEach(t => t.stop()); } catch {}
      // Clear DOM
      if (ref.current) ref.current.innerHTML = "";
    };

    const startZXing = async () => {
      try {
        if (!ref.current) throw new Error("container-missing");
        
        zxingReader = new BrowserMultiFormatReader();
        
        const video = document.createElement("video");
        video.setAttribute("playsinline", "true");
        video.setAttribute("autoplay", "true");
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        
        ref.current.style.minHeight = "240px";
        ref.current.appendChild(video);

        // ✅ CORRECTION: Utiliser decodeFromVideoDevice avec callback continu
        await zxingReader.decodeFromVideoDevice(
          undefined, // deviceId (auto-select caméra arrière)
          video,
          (result, error) => {
            if (!mounted || !isScanning) return;
            
            if (result) {
              const code = result.getText();
              if (code && code.length > 0) {
                console.log("✅ Code-barres détecté (ZXing):", code);
                setIsScanning(false);
                onDetected(code);
              }
            }
            // Ignorer les erreurs (frames sans code-barres)
          }
        );
        
        console.log("📷 ZXing scanner démarré avec succès");
        
      } catch (e: any) {
        console.error("❌ ZXing error:", e?.message);
        setError("Erreur caméra ZXing, essai Quagga...");
        if (mounted) setEngine("quagga");
      }
    };

    const startQuagga = async () => {
      try {
        if (!ref.current) throw new Error("container-missing");
        // Crée un conteneur solide pour éviter le canvas null
        const holder = document.createElement("div");
        holder.style.position = "relative";
        holder.style.width = "100%";
        holder.style.aspectRatio = "16/9";
        holder.style.minHeight = "240px";
        ref.current.appendChild(holder);

        await new Promise<void>((resolve, reject) => {
          Quagga.init(
            {
              inputStream: {
                name: "Live",
                type: "LiveStream",
                target: holder,
                constraints: {
                  facingMode: "environment",
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                },
              },
              locator: { patchSize: "medium", halfSample: true },
              decoder: {
                readers: [
                  "ean_reader",
                  "ean_8_reader",
                  "upc_reader",
                  "upc_e_reader",
                  "code_128_reader",
                ],
              },
              locate: true,
            },
            (err) => (err ? reject(err) : resolve())
          );
        });

        // Démarre après un petit delay pour laisser le canvas se créer
        setTimeout(() => {
          try { Quagga.start(); } catch {}
        }, 50);

        let last = "";
        let lastTime = 0;

        Quagga.onDetected((data: any) => {
          const code = data?.codeResult?.code;
          const now = Date.now();
          if (!code || !mounted || !isScanning) return;
          if (code === last && now - lastTime < 900) return;
          last = code; lastTime = now;
          console.log("✅ Code-barres détecté (Quagga):", code);
          setIsScanning(false);
          onDetected(code);
        });

        Quagga.onProcessed(() => {
          // no-op; garde la boucle en vie
        });
      } catch (e: any) {
        console.error("❌ Quagga error:", e?.message);
        setError("Erreur caméra Quagga, essai ZXing...");
        if (mounted) setEngine("zxing");
      }
    };

    if (engine === "zxing") startZXing();
    else startQuagga();

    return () => { mounted = false; cleanup(); };
  }, [engine, isScanning, onDetected]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className="w-full bg-black rounded-xl overflow-hidden relative"
        style={{ aspectRatio: "16/9", minHeight: 240 }}
        ref={ref}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2/3 h-1/3 border-2 border-white/70 rounded-md" />
        </div>
        {!isScanning && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-lg">Code détecté !</div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>💡 Astuce: bonne lumière, cadrez le code dans le rectangle</span>
        <button
          className="ml-auto text-emerald-600 font-medium hover:underline"
          onClick={() => {
            // Toggle manual engine
            setIsScanning(true);
            setEngine(engine === "zxing" ? "quagga" : "zxing");
          }}
        >
          Changer de moteur ({engine === "zxing" ? "Quagga" : "ZXing"})
        </button>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            Annuler
          </button>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;