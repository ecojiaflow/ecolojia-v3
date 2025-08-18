// PATH: frontend/src/components/scanner/BarcodeScanner.tsx
import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

type Props = {
  onDetected: (barcode: string) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
  constraints?: MediaTrackConstraints;
  showGuide?: boolean;
};

export default function BarcodeScanner({
  onDetected,
  onError,
  onClose,
  constraints,
  showGuide = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        setActive(true);
        setErrMsg(null);
        await Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              target: containerRef.current!,
              constraints: {
                facingMode: "environment",
                ...(constraints || {}),
              },
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
              setErrMsg(err.message || String(err));
              onError?.(err as Error);
              setActive(false);
              return;
            }
            if (!cancelled) Quagga.start();
          }
        );

        Quagga.onDetected((result: any) => {
          const code = result?.codeResult?.code;
          if (code) {
            Quagga.stop();
            setActive(false);
            onDetected(code);
          }
        });
      } catch (e: any) {
        setErrMsg(e?.message || "Impossible d'accéder à la caméra");
        onError?.(e);
        setActive(false);
      }
    }

    start();

    return () => {
      cancelled = true;
      try {
        Quagga.offDetected(() => {});
        Quagga.stop();
      } catch {
        /* noop */
      }
    };
  }, [constraints, onDetected, onError]);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="w-full aspect-video bg-black rounded-xl overflow-hidden"
        role="img"
        aria-label="Flux caméra"
      />
      {showGuide && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-3/4 h-24 border-4 border-white/80 rounded-lg" />
        </div>
      )}
      {!active && errMsg && (
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
