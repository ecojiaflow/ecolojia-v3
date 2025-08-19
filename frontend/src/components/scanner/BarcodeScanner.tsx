// PATH: frontend/src/components/scanner/BarcodeScanner.tsx
import { useEffect, useRef, useState } from "react";
import { FLAGS } from "../../config/featureFlags";
import Quagga from "@ericblade/quagga2";

type Props = {
  onDetected: (barcode: string) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
  showGuide?: boolean;
};

export default function BarcodeScanner({ onDetected, onError, onClose, showGuide = true }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<"native" | "quagga" | "manual">("manual");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const provider = FLAGS.SCANNER_PROVIDER; // "auto" | "native" | "quagga"

  // ---- Helpers
  const stopNative = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
        v.srcObject = null;
      } catch {}
    }
  };

  const stopQuagga = () => {
    try {
      Quagga.offDetected(() => {});
      Quagga.stop();
    } catch {}
  };

  // ---- Init
  useEffect(() => {
    let cancelled = false;

    async function tryNative() {
      try {
        if (!("BarcodeDetector" in window)) throw new Error("BarcodeDetector non supporté");
        // @ts-ignore
        const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "code_128"] });
        setMode("native");

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        streamRef.current = stream;
        const v = videoRef.current!;
        v.srcObject = stream;
        await new Promise<void>((res) => v.addEventListener("loadedmetadata", () => res(), { once: true }));
        try {
          await v.play();
        } catch {
          /* autoplay refusé : l'utilisateur cliquera "Capturer" si besoin */
        }

        let raf = 0;
        const loop = async () => {
          if (cancelled) return;
          try {
            const bitmap = await createImageBitmap(v);
            // @ts-ignore
            const codes = await detector.detect(bitmap);
            if (codes && codes.length > 0) {
              const code = codes[0].rawValue || codes[0].raw || codes[0].value;
              if (code) {
                stopNative();
                onDetected(String(code));
                return;
              }
            }
          } catch (e: any) {
            // ignore transient
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(raf);
      } catch (e: any) {
        throw e;
      }
    }

    function tryQuagga() {
      return new Promise<void>((resolve, reject) => {
        setMode("quagga");
        const target = wrapRef.current;
        if (!target) return reject(new Error("Ciblage DOM indisponible"));
        // Quagga ajoute lui-même un <video> + canvas dans le container
        Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              target,
              constraints: { facingMode: "environment" },
            },
            locator: { patchSize: "medium", halfSample: true },
            numOfWorkers: navigator.hardwareConcurrency || 2,
            frequency: 10,
            decoder: {
              readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader"],
            },
            locate: true,
          },
          (err: any) => {
            if (err) {
              reject(err);
              return;
            }
            Quagga.start();
            Quagga.onDetected((result: any) => {
              const code = result?.codeResult?.code;
              if (code) {
                stopQuagga();
                onDetected(String(code));
              }
            });
            resolve();
          }
        );
      });
    }

    (async () => {
      setErrMsg(null);
      try {
        if (provider === "native") {
          await tryNative();
        } else if (provider === "quagga") {
          await tryQuagga();
        } else {
          // auto
          try {
            await tryNative();
          } catch {
            await tryQuagga();
          }
        }
      } catch (e: any) {
        console.warn("[Scanner] fallback manual:", e);
        setErrMsg(e?.message || "Scanner indisponible");
        setMode("manual");
      }
    })();

    return () => {
      cancelled = true;
      stopNative();
      stopQuagga();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, onDetected]);

  return (
    <div className="relative w-full">
      {/* Container pour Quagga */}
      <div ref={wrapRef} className="w-full aspect-video bg-black rounded-xl overflow-hidden" />
      {/* Video pour Native detector */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {showGuide && (mode === "native" || mode === "quagga") && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-3/4 h-24 border-4 border-white/80 rounded-lg" />
        </div>
      )}

      {errMsg && (
        <div className="mt-3 text-sm text-red-600" role="alert">
          {errMsg}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          aria-label="Fermer le scanner"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}