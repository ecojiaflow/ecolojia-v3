import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, Loader2 } from 'lucide-react';

const ScanPhotoPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startCamera = async () => {
    console.log('🎬 START CAMERA');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      
      console.log('✅ Stream obtained');
      setStream(s);
      
      setTimeout(() => {
        if (videoRef.current) {
          console.log('📹 Attaching stream');
          videoRef.current.srcObject = s;
          videoRef.current.play()
            .then(() => console.log('✅ Playing'))
            .catch(err => console.error('❌ Play error:', err));
        }
      }, 150);
      
    } catch (err) {
      console.error('❌ CAMERA ERROR:', err);
      alert('Impossible d\'ouvrir la caméra');
    }
  };

  const capture = () => {
    console.log('📸 CAPTURE');
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      alert('Vidéo non prête');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    console.log('✅ Captured');
    
    setPhoto(dataUrl);
    
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  const analyze = async () => {
    console.log('🔍 ANALYZE START');
    if (!photo) return;
    setLoading(true);
    
    try {
      const blob = await fetch(photo).then(r => r.blob());
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('categoryType', 'auto');
      
      const res = await fetch('https://ecolojia-backendvf.onrender.com/api/vision/analyze-photo', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      console.log('✅ Result:', data);
      
      if (data.product?._id) {
        navigate(`/product/${data.product._id}`);
      } else {
        alert('Produit non trouvé');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Erreur analyse');
      setLoading(false);
    }
  };

  console.log('🔄 Render - stream:', !!stream, 'photo:', !!photo, 'loading:', loading);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* HEADER */}
      <div className="p-4 border-b flex items-center gap-4 flex-shrink-0">
        <button onClick={() => navigate('/')} type="button">
          <ArrowLeft />
        </button>
        <h1 className="font-bold">Analyser par photo</h1>
      </div>
      
      {/* CONTENU - overflow-auto pour scroll si besoin */}
      <div className="flex-1 overflow-auto">
        <div className="h-full p-4">
          {loading ? (
            // LOADING
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-green-500" />
              <p className="mt-4 font-medium">Analyse en cours...</p>
            </div>
          ) : photo ? (
            // APERÇU PHOTO - AVEC BOUTONS GARANTIS VISIBLES
            <div className="flex flex-col gap-4 min-h-full">
              {/* Image - max-h pour laisser place aux boutons */}
              <div className="flex-1 bg-black rounded-2xl overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <img src={photo} className="w-full h-full object-contain" alt="Photo" />
              </div>
              
              {/* Boutons - TOUJOURS VISIBLES */}
              <div className="flex gap-3 flex-shrink-0">
                <button 
                  onClick={() => { 
                    console.log('🔄 REPRENDRE'); 
                    setPhoto(null); 
                    startCamera(); 
                  }} 
                  className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-medium text-gray-700 active:scale-95 transition-transform"
                  type="button"
                >
                  Reprendre
                </button>
                <button 
                  onClick={() => {
                    console.log('🔴 ANALYSER CLICK');
                    analyze();
                  }} 
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  type="button"
                >
                  <Check className="w-5 h-5" /> Analyser
                </button>
              </div>
            </div>
          ) : stream ? (
            // CAMÉRA
            <div className="h-full relative bg-black rounded-2xl overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover"
                style={{ display: 'block' }}
              />
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-[85%] h-[65%] border-4 border-white/60 rounded-2xl"></div>
              </div>
              
              <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔴 CAPTURE CLICK');
                    capture();
                  }}
                  className="p-8 bg-white rounded-full shadow-2xl active:scale-95 transition-transform"
                  type="button"
                >
                  <Camera className="w-10 h-10 text-gray-900" />
                </button>
              </div>
            </div>
          ) : (
            // BOUTON DÉMARRER
            <div className="h-full flex items-center justify-center">
              <button 
                onClick={startCamera} 
                className="px-8 py-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl flex items-center gap-3"
                type="button"
              >
                <Camera className="w-8 h-8" />
                <div className="text-left">
                  <div className="font-bold text-lg">Prendre une photo</div>
                  <div className="text-sm opacity-90">Ouvrir la caméra</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ScanPhotoPage;
