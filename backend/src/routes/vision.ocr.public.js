const express = require("express");
const multer  = require("multer");
const upload  = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
const { analyze } = require("../services/visionRuntime");

const router = express.Router();
router.use(express.json({ limit: "1mb" }));

async function fetchBufferFromUrl(imageUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(imageUrl, {
      redirect: "follow",
      headers: {
        "user-agent": "EcolojiaOCR/1.0 (+https://ecolojia.app)"
      },
      signal: controller.signal
    });
    if (!res.ok) {
      throw new Error(`IMAGE_FETCH_FAILED status=${res.status}`);
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } finally {
    clearTimeout(timer);
  }
}

async function getBufferFromRequest(req) {
  if (req.file?.buffer) return req.file.buffer;
  const imageUrl = (req.body?.imageUrl || req.query?.imageUrl || "").toString();
  if (imageUrl) return await fetchBufferFromUrl(imageUrl);
  throw new Error("NO_IMAGE");
}

// PUBLIC: POST /api/vision-ocr/analyze-image (multipart: image) ou (json: {imageUrl})
router.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    const buffer = await getBufferFromRequest(req);
    const out = await analyze(buffer); // google OU stub
    res.json({ success: true, ...out });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message || "BAD_REQUEST" });
  }
});

// PUBLIC: GET /api/vision-ocr/analyze-image?imageUrl=...
router.get("/analyze-image", async (req, res) => {
  try {
    const buffer = await getBufferFromRequest(req);
    const out = await analyze(buffer);
    res.json({ success: true, ...out });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message || "BAD_REQUEST" });
  }
});

module.exports = router;
