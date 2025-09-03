// PATH: frontend/src/components/scanner/PhotoCapture.tsx
import { useEffect, useRef, useState } from "react";
import { analyzeImage } from "../../services/visionService";
import { FLAGS } from "../../config/featureFlags";

type Props = {
  onOcrDone: (data: { ingredients: string[]; barcode?: string; text?: string }) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
  maxSize?: number;
  acceptedFormats?: string[];
};

export default function PhotoCapture({
  onOcrDone,
  onError,
  onClose,
  maxSize = 5 * 1024 * 1024,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp"],
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.addEventListener(
          "loadedmetadata",
          async () => {
            try {
              await video.play();
            } catch {
              /* autoplay refusé */
            } finally {
              if (!cancelled) setStreaming(true);
            }
          },
          { once: true }
        );
      } catch (e: any) {
        setError(e?.message || "Caméra indisponible");
        onError?.(e);
      }
    }
    start();
    return () => {
      cancelled = true;
      const s = streamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      const v = videoRef.current;
      if (v) {
        try {
          v.pause();
          v.srcObject = null;
        } catch {}
      }
    };
  }, [onError]);

  function captureBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return reject(new Error("Canvas/Video non prêt"));
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Contexte 2D indisponible"));
      ctx.drawImage(video, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Capture échouée"));
          if (!acceptedFormats.includes(blob.type)) return reject(new Error("Format image non supporté"));
          if (blob.size > maxSize) return reject(new Error("Image trop volumineuse"));
          resolve(blob);
        },
        "image/jpeg",
        0.92
      );
    });
  }

  async function handleCapture() {
    try {
      setBusy(true);
      setError(null);
      const blob = await captureBlob();
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const preview = URL.createObjectURL(blob);
      setPreviewURL(preview);

      // Si l'OCR n'est pas activé, on ne fait pas d'appel → on renvoie une structure vide
      if (!FLAGS.OCR_ENABLED) {
        onOcrDone({ ingredients: [], text: "OCR désactivé (mode dev)", barcode: undefined });
        return;
      }

      try {
        const ocr = await analyzeImage(file); // Peut lever 401 en prod → catch
        onOcrDone({
          ingredients: ocr.ingredients || [],
          barcode: ocr.barcode,
          text: ocr.text,
        });
      } catch (e: any) {
        setError("OCR indisponible (auth requise). Utilisez la saisie manuelle.");
        onError?.(e);
      }
    } catch (e: any) {
      setError(e?.message || "Erreur de capture");
      onError?.(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      {FLAGS.OCR_ENABLED ? null : (
        <div className="mb-3 p-3 rounded-lg border bg-gray-100 text-sm">
          OCR désactivé en environnement actuel. Passez en saisie manuelle ou activez <code>VITE_OCR_ENABLED=1</code>.
        </div>
      )}

      <div className="relative">
        <video ref={videoRef} className="w-full rounded-xl bg-black" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {previewURL && (
        <div className="mt-3">
          <img src={previewURL} alt="Prévisualisation" className="rounded-lg max-h-64" />
        </div>
      )}
      {error && (
        <div className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={busy || !streaming}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
        >
          {busy ? "Analyse en cours…" : "Capturer & analyser"}
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200">
          Fermer
        </button>
      </div>
    </div>
  );
}
