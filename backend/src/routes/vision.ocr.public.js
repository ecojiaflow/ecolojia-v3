const express = require("express");
const multer  = require("multer");
const upload  = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
const { analyze } = require("../services/visionRuntime");

const router = express.Router();
router.use(express.json({ limit: "1mb" }));

// Optionnel: rate limit léger si dispo, sinon rien
try {
  const { apiLimiter } = require("../middleware");
  if (apiLimiter) router.use(apiLimiter);
} catch (e) {}

async function getBufferFromRequest(req) {
  if (req.file?.buffer) return req.file.buffer;
  const imageUrl = req.body?.imageUrl;
  if (imageUrl && typeof imageUrl === "string") {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error("IMAGE_FETCH_FAILED");
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("NO_IMAGE");
}

// PUBLIC: POST /api/vision-ocr/analyze-image
router.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    const buffer = await getBufferFromRequest(req);
    const out = await analyze(buffer); // google OU stub
    res.json({ success: true, ...out });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message || "BAD_REQUEST" });
  }
});

module.exports = router;
