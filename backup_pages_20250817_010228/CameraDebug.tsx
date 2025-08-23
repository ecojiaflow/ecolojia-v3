import React, { useState } from "react";
import PhotoCapture from "../components/PhotoCapture";

const CameraDebug = () => {
  const [image, setImage] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-eco-text">ÃƒÂ°Ã…Â¸ââ‚¬ÂÃ‚Â¬ Test Caméra Mobile</h1>

      <PhotoCapture
        label="ÃƒÂ°Ã…Â¸ââ‚¬Å“Ã‚Â· Appareil mobile"
        onCapture={(img) => setImage(img)}
      />

      {image && (
        <div>
          <h2 className="mt-4 text-eco-text/80 text-sm">ÃƒÂ°Ã…Â¸ââ‚¬Å“Ã‚Â¸ Preview :</h2>
          <img src={image} alt="Capture" className="w-full mt-2 rounded-xl border" />
        </div>
      )}
    </div>
  );
};

export default CameraDebug;


