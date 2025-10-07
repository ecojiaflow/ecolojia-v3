const keywords = [
  "gluten","lait","lactose","arachide","noisette","noix","amande","soja",
  "oeuf","œuf","moutarde","sésame","céleri","poisson","crustacé","sulfite"
];

function parseIngredientsFromText(text) {
  if (!text || typeof text !== "string") return [];
  const t = text.replace(/\s+/g, " ").toLowerCase();
  return Array.from(new Set(
    t.split(/[,;•\-]\s+/).map(s => s.trim()).filter(s => s.length >= 2 && s.length <= 80)
  )).slice(0, 100);
}

function detectWarnings(text) {
  if (!text) return [];
  const t = text.toLowerCase();
  return keywords.filter(k => t.includes(k));
}

// Construire credentials depuis variables séparées (Render) ou JSON unique
function getGoogleCredentials() {
  // Option 1: JSON complet dans une variable
  if (process.env.GOOGLE_VISION_CREDENTIALS_JSON) {
    return JSON.parse(process.env.GOOGLE_VISION_CREDENTIALS_JSON);
  }
  
  // Option 2: Variables séparées (Render)
  if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL) {
    return {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN || "googleapis.com"
    };
  }
  
  return null;
}

async function analyzeWithGoogle(buffer) {
  const vision = require("@google-cloud/vision");
  const creds = getGoogleCredentials();
  
  if (!creds) {
    throw new Error("NO_GOOGLE_CREDS");
  }
  
  const client = new vision.ImageAnnotatorClient({ credentials: creds });
  const [result] = await client.textDetection({ image: { content: buffer } });
  const rawText = result?.fullTextAnnotation?.text || (result?.textAnnotations?.[0]?.description ?? "");
  const ingredients = parseIngredientsFromText(rawText);
  const warnings = detectWarnings(rawText);
  return { source: "google", rawText, ingredients, warnings };
}

async function analyzeStub(buffer) {
  const rawText = "Ingrédients : sucre, huile de palme, noisettes, cacao, lait écrémé en poudre, soja lécithine.";
  const ingredients = parseIngredientsFromText(rawText);
  const warnings = detectWarnings(rawText);
  return { source: "stub", rawText, ingredients, warnings };
}

async function analyze(buffer) {
  try {
    return await analyzeWithGoogle(buffer);
  } catch (e) {
    console.warn("[Vision] Fallback to stub:", e.message);
    return await analyzeStub(buffer);
  }
}

module.exports = { analyze };