// PATH: backend\src\tests\test-ocr.js
/**
 * Script de validation OCR ECOLOJIA v5
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * â€¢ Corrige lâ€™envoi du fichier : on precise le **content-type image/jpeg**
 *   pour que Multer accepte le flux (sinon mimetype = octet/stream â†’ rejete).
 * â€¢ Si lâ€™image provient dâ€™un fichier local, on saute /analyze-url.
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Utilitaires â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
    console.log('â„¹ï¸  Image locale trouvee â†’ sample.jpg');
    return { local: true, path: LOCAL_SAMPLE };
  }
  for (const url of REMOTE_IMAGES) {
    if (await headOk(url)) {
      console.log(`â„¹ï¸  Image distante valide â†’ ${url}`);
      return { local: false, url };
    }
    console.warn(`âš ï¸  Image indisponible â†’ ${url}`);
  }
  throw new Error(
    'Aucune image disponible : ajoutez Â« sample.jpg Â» dans backend/src/tests ou verifiez votre connexion.'
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Authentification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

async function login () {
  const { data } = await axios.post(`${API_URL}/api/auth/login`, CRED);
  TOKEN = data.token;
  console.log('âœ…  Connexion reussie');
}
const authH = () => ({ Authorization: `Bearer ${TOKEN}` });

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Tests Vision â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

async function analyzeUrl (imageUrl) {
  console.log('\nðŸ”  [1] /analyze-url');
  const { data } = await axios.post(
    `${API_URL}/api/vision/analyze-url`,
    { imageUrl, useNewOCR: true },
    { headers: authH() }
  );
  console.log('âœ…  Reponse:', data.result);
}

async function analyzeFile (filePath) {
  console.log('\nðŸ”  [2] /analyze (upload)');

  const form = new FormData();
  form.append('image', fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: 'image/jpeg'       // â† Correctif principal
  });
  form.append('useNewOCR', 'true');

  const { data } = await axios.post(
    `${API_URL}/api/vision/analyze`,
    form,
    { headers: { ...form.getHeaders(), ...authH() } }
  );
  console.log('âœ…  Reponse:', data.result);
}

async function compareServices (filePath) {
  console.log('\nðŸ”  [3] /compare');
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Lancement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

(async () => {
  console.log('ðŸš€  Lancement tests OCR');
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

  console.log('\nâœ…  Tous les tests termines');
})();
