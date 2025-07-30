// Contrôle global de la caméra scanner
let currentVideoStream: MediaStream | null = null;

export const setScannerStream = (stream: MediaStream | null) => {
  currentVideoStream = stream;
};

export const stopScannerCamera = () => {
  if (currentVideoStream) {
    currentVideoStream.getTracks().forEach(track => {
      track.stop();
      console.log('Scanner camera track stopped:', track.kind);
    });
    currentVideoStream = null;
  }
};

export const getScannerStream = () => currentVideoStream;