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
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
        console.log('✅ Camera started');
      }
    } catch (err) {
      console.error('❌ ERREUR CAMERA:', err);
      alert('Impossible d\'ouvrir la caméra');
    }
  };

  const capture = () => {
    console.log('📸 CAPTURE CLICK');
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Refs null');
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    console.log('📹 Video size:', video.videoWidth, 'x', video.videoHeight);
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('❌ Canvas context null');
      return;
    }
    
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    console.log('✅ Photo captured, size:', dataUrl.length);
    
    setPhoto(dataUrl);
    
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
      console.log('✅ Camera stopped');
    }
  };

  const analyze = async () => {
    console.log('🔍 ANALYZE');
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
      console.log('✅ RESULT:', data);
      
      if (data.product?._id) {
        navigate(`/product/${data.product._id}`);
      } else {
        alert('Produit non trouvé');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ ERREUR ANALYSE:', err);
      alert('Erreur analyse');
      setLoading(false);
    }
  };

  console.log('🔄 RENDER - stream:', !!stream, 'photo:', !!photo, 'loading:', loading);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="p-4 border-b flex items-center gap-4">
        <button onClick={() => navigate('/')} type="button">
          <ArrowLeft />
        </button>
        <h1 className="font-bold">Analyser par photo</h1>
      </div>
      
      <div className="flex-1 p-4 relative">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-500" />
            <p className="ml-4">Analyse en cours...</p>
          </div>
        ) : photo ? (
          <div className="h-full flex flex-col">
            <img src={photo} className="flex-1 object-contain rounded-2xl bg-black" alt="Captured" />
            <div className="mt-4 flex gap-3">
              <button 
                onClick={() => { 
                  console.log('🔄 REPRENDRE'); 
                  setPhoto(null); 
                  startCamera(); 
                }} 
                className="flex-1 p-4 border-2 rounded-xl font-medium"
                type="button"
              >
                Reprendre
              </button>
              <button 
                onClick={analyze} 
                className="flex-1 p-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                type="button"
              >
                <Check className="w-5 h-5" /> Analyser
              </button>
            </div>
          </div>
        ) : stream ? (
          <div className="h-full relative rounded-2xl overflow-hidden bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            
            {/* Cadre guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[85%] h-[65%] border-4 border-white/60 rounded-2xl shadow-2xl"></div>
            </div>
            
            {/* Bouton CAPTURE - Z-INDEX MAX */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-[100]">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔴 BUTTON CLICKED');
                  capture();
                }}
                className="p-8 bg-white rounded-full shadow-2xl active:scale-95 transition-transform cursor-pointer"
                type="button"
                style={{ touchAction: 'manipulation' }}
              >
                <Camera className="w-10 h-10 text-gray-900" />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <button 
              onClick={startCamera} 
              className="px-8 py-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl flex items-center gap-3 shadow-xl"
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
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ScanPhotoPage;
