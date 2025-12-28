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
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      console.log('✅ Stream obtained');
      setStream(s);
      
      // CRITIQUE : setTimeout pour garantir que videoRef est prêt
      setTimeout(() => {
        if (videoRef.current) {
          console.log('📹 Attaching stream to video');
          videoRef.current.srcObject = s;
          videoRef.current.play()
            .then(() => console.log('✅ Video playing'))
            .catch(err => {
              console.error('❌ Play error:', err);
              alert('Erreur lecture vidéo');
            });
        } else {
          console.error('❌ videoRef null après setTimeout');
        }
      }, 150);
      
    } catch (err) {
      console.error('❌ CAMERA ERROR:', err);
      alert('Impossible d\'ouvrir la caméra');
    }
  };

  const capture = () => {
    console.log('📸 CAPTURE');
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Refs null');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    console.log('📹 readyState:', video.readyState, 'size:', video.videoWidth, 'x', video.videoHeight);
    
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      alert('Vidéo non prête - Attendez 2 secondes');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('❌ Canvas context null');
      return;
    }
    
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    console.log('✅ Captured, size:', dataUrl.length);
    
    setPhoto(dataUrl);
    
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
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

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="p-4 border-b flex items-center gap-4">
        <button onClick={() => navigate('/')} type="button">
          <ArrowLeft />
        </button>
        <h1 className="font-bold">Analyser par photo</h1>
      </div>
      
      <div className="flex-1 p-4">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-500" />
            <p className="mt-4 font-medium">Analyse en cours...</p>
          </div>
        ) : photo ? (
          <div className="h-full flex flex-col">
            <img src={photo} className="flex-1 object-contain rounded-2xl bg-black" alt="Photo" />
            <div className="mt-4 flex gap-3">
              <button 
                onClick={() => { setPhoto(null); startCamera(); }} 
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
          <div className="h-full relative bg-black rounded-2xl overflow-hidden">
            {/* VIDEO - Absolute pour remplir conteneur */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: 'block' }}
            />
            
            {/* CADRE - pointer-events-none pour ne pas bloquer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-[85%] h-[65%] border-4 border-white/60 rounded-2xl"></div>
            </div>
            
            {/* BOUTON - z-20 au-dessus de tout */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔴 CLICK');
                  capture();
                }}
                className="p-8 bg-white rounded-full shadow-2xl active:scale-95 transition-transform"
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
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ScanPhotoPage;
