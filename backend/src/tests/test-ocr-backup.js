// PATH: backend\src\tests\test-ocr.js
/**
 * Script de validation OCR ECOLOJIA v5
 * ────────────────────────────────────────────────────────────────────────────
 * • Corrige l’envoi du fichier : on précise le **content-type image/jpeg**
 *   pour que Multer accepte le flux (sinon mimetype = octet/stream → rejeté).
 * • Si l’image provient d’un fichier local, on saute /analyze-url.
 * ────────────────────────────────────────────────────────────────────────────
 */

const axios    = require('axios');
const FormData = require('form-data');
const fs       = require('fs');
const path     = require('path');

const API_URL      = 'http://localhost:5001';
const LOCAL_SAMPLE = path.join(__dirname, 'sample.jpg');

const REMOTE_IMAGES = [
  'https://upload.wikimedia.org/wikipedia/commons/a/a3/Coca-Cola_can_%282012_design%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/1/12/Orangina.jpg'
];

const CRED  = { email: 'test@example.com', password: 'password123' };
let   TOKEN = '';

/* ─────────────────────────── Utilitaires ─────────────────────────── */

const exists = (p) => fs.existsSync(p);

async function headOk (url) {
  try {
    const r = await axios.head(url, { timeout: 7000, maxRedirects: 5 });
    return r.status >= 200 && r.status < 400;
  } catch {
    return false;
  }
}

async function download (url, dest) {
  const res = await axios({ url, method: 'GET', responseType: 'stream', timeout: 15000 });
  const w   = fs.createWriteStream(dest);
  res.data.pipe(w);
  return new Promise((ok, ko) => { w.on('finish', ok); w.on('error', ko); });
}

async function getImage () {
  if (exists(LOCAL_SAMPLE)) {
    console.log('ℹ️  Image locale trouvée → sample.jpg');
    return { local: true, path: LOCAL_SAMPLE };
  }
  for (const url of REMOTE_IMAGES) {
    if (await headOk(url)) {
      console.log(`ℹ️  Image distante valide → ${url}`);
      return { local: false, url };
    }
    console.warn(`⚠️  Image indisponible → ${url}`);
  }
  throw new Error(
    'Aucune image disponible : ajoutez « sample.jpg » dans backend/src/tests ou vérifiez votre connexion.'
  );
}

/* ─────────────────────────── Authentification ────────────────────── */

async function login () {
  const { data } = await axios.post(`${API_URL}/api/auth/login`, CRED);
  TOKEN = data.token;
  console.log('✅  Connexion réussie');
}
const authH = () => ({ Authorization: `Bearer ${TOKEN}` });

/* ─────────────────────────── Tests Vision ────────────────────────── */

async function analyzeUrl (imageUrl) {
  console.log('\n🔍  [1] /analyze-url');
  const { data } = await axios.post(
    `${API_URL}/api/vision/analyze-url`,
    { imageUrl, useNewOCR: true },
    { headers: authH() }
  );
  console.log('✅  Réponse:', data.result);
}

async function analyzeFile (filePath) {
  console.log('\n🔍  [2] /analyze (upload)');

  const form = new FormData();
  form.append('image', fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: 'image/jpeg'       // ← Correctif principal
  });
  form.append('useNewOCR', 'true');

  const { data } = await axios.post(
    `${API_URL}/api/vision/analyze`,
    form,
    { headers: { ...form.getHeaders(), ...authH() } }
  );
  console.log('✅  Réponse:', data.result);
}

async function compareServices (filePath) {
  console.log('\n🔍  [3] /compare');
  const form = new FormData();
  form.append('image', fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: 'image/jpeg'
  });
  const { data } = await axios.post(
    `${API_URL}/api/vision/compare`,
    form,
    { headers: { ...form.getHeaders(), ...authH() } }
  );
  console.dir(data.comparison, { depth: 2, colors: true });
}

/* ─────────────────────────── Lancement ───────────────────────────── */

(async () => {
  console.log('🚀  Lancement tests OCR');
  await login();

  const img = await getImage();
  let tmp   = null;

  try {
    if (!img.local) {
      tmp = path.join(__dirname, 'tmp-test.jpg');
      await download(img.url, tmp);
      await analyzeUrl(img.url);
    }
    const filePath = img.local ? img.path : tmp;
    await analyzeFile(filePath);
    await compareServices(filePath);
  } finally {
    tmp && exists(tmp) && fs.unlinkSync(tmp);
  }

  console.log('\n✅  Tous les tests terminés');
})();
