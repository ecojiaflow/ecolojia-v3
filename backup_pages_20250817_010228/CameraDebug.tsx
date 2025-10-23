import React, { useState } from "react";
import PhotoCapture from "../components/PhotoCapture";

const CameraDebug = () => {
  const [image, setImage] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-eco-text">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â¬ Test CamÃ©ra Mobile</h1>

      <PhotoCapture
        label="ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â· Appareil mobile"
        onCapture={(img) => setImage(img)}
      />

      {image && (
        <div>
          <h2 className="mt-4 text-eco-text/80 text-sm">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â¸ Preview :</h2>
          <img src={image} alt="Capture" className="w-full mt-2 rounded-xl border" />
        </div>
      )}
    </div>
  );
};

export default CameraDebug;


