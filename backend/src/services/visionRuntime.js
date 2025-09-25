const keywords = [
  "gluten","lait","lactose","arachide","noisette","noix","amande","soja",
  "oeuf","œuf","moutarde","sésame","céleri","poisson","crustacé","sulfite"
];

function parseIngredientsFromText(text) {
  if (!text || typeof text !== "string") return [];
  const t = text.replace(/\s+/g, " ").toLowerCase();
  // naïf : coupe par virgules/points-virgules/puces
  return Array.from(new Set(
    t.split(/[,;•\-]\s+/).map(s => s.trim()).filter(s => s.length >= 2 && s.length <= 80)
  )).slice(0, 100);
}

function detectWarnings(text) {
  if (!text) return [];
  const t = text.toLowerCase();
  return keywords.filter(k => t.includes(k));
}

async function analyzeWithGoogle(buffer) {
  const vision = require("@google-cloud/vision");
  const creds = process.env.GOOGLE_VISION_CREDENTIALS_JSON;
  if (!creds) throw new Error("NO_GOOGLE_CREDS");
  const client = new vision.ImageAnnotatorClient({
    credentials: JSON.parse(creds)
  });
  const [result] = await client.textDetection({ image: { content: buffer } });
  const rawText = result?.fullTextAnnotation?.text || (result?.textAnnotations?.[0]?.description ?? "");
  const ingredients = parseIngredientsFromText(rawText);
  const warnings = detectWarnings(rawText);
  return { source: "google", rawText, ingredients, warnings };
}

async function analyzeStub(buffer) {
  // Petit stub utile pour valider l’UI même sans OCR
  const rawText = "Ingrédients : sucre, huile de palme, noisettes, cacao, lait écrémé en poudre, soja lécithine.";
  const ingredients = parseIngredientsFromText(rawText);
  const warnings = detectWarnings(rawText);
  return { source: "stub", rawText, ingredients, warnings };
}

async function analyze(buffer) {
  try {
    return await analyzeWithGoogle(buffer);
  } catch (_e) {
    return await analyzeStub(buffer);
  }
}

module.exports = { analyze };
