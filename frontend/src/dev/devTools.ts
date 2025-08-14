const API_URL = import.meta.env.VITE_API_URL || https://ecolojia-backendvf.onrender.com/api;

function applyQuickFixes() {
  console.log(Debug active (DEV));
  window.addEventListener(error, (e) => console.error(Erreur JS:, e.message, e.error));
  window.addEventListener(unhandledrejection, (e) => console.error(Promesse non geree:, e.reason));
}

async function testBackend() {
  console.log(Test Backend ECOLOJIA...);
  console.log(API URL:, API_URL);
  const rows = [];
  try {
    const healthRes = await fetch(https://ecolojia-backendvf.onrender.com/health);
    rows.push({ endpoint: /health, status: healthRes.status, ok: healthRes.ok ? OK : KO });
    const statusRes = await fetch(`${API_URL}/analysis/_service/status`);
    rows.push({ endpoint: /api/analysis/_service/status, status: statusRes.status, ok: statusRes.ok ? OK : KO });
    if (statusRes.ok) console.log(Service Analysis:, await statusRes.json());
    const pingRes = await fetch(`${API_URL}/analysis/ping`, {
      method: POST,
      headers: { Content-Type: application/json },
      body: JSON.stringify({ test: true })
    });
    rows.push({ endpoint: /api/analysis/ping, status: pingRes.status, ok: pingRes.ok ? OK : KO });
    console.table(rows);
  } catch (err) {
    console.error(Erreur test backend:, err);
  }
}

async function testAnalysis(category = food) {
  console.log(`Test analyse ${category}...`);
  const samples = {
    food: { name: Cereales chocolat test, category: food, ingredients: Cereales (ble 60%), sucre, chocolat 15% (sucre, cacao), sirop de glucose, sel, vitamines (B1, B2), emulsifiant E322 },
    cosmetic: { name: Creme hydratante test, category: cosmetic, ingredients: Aqua, Glycerin, Dimethicone, Cetearyl Alcohol, Parfum, Limonene, Methylparaben, BHT },
    detergent: { name: Lessive liquide test, category: detergent, ingredients: 5-15% tensioactifs anioniques, <5% tensioactifs non-ioniques, parfum (Limonene), enzymes }
  };
  try {
    const res = await fetch(`${API_URL}/analysis/manual`, {
      method: POST,
      headers: { Content-Type: application/json },
      body: JSON.stringify(samples[category])
    });
    console.log(Status:, res.status);
    if (res.ok) console.log(Resultat:, await res.json());
    else console.error(Erreur:, await res.text());
  } catch (err) {
    console.error(Exception:, err);
  }
}

async function testComplet() {
  console.log(TEST COMPLET ECOLOJIA);
  console.log([1] TEST BACKEND); await testBackend();
  console.log([2] TEST ANALYSES);
  await testAnalysis(food);
  await testAnalysis(cosmetic);
  await testAnalysis(detergent);
  console.log([3] ROUTES FRONTEND);
  console.log(Route actuelle:, window.location.pathname);
  console.log(Routes: /, /scan, /results, /search, /dashboard);
}

export function registerDevTools() {
  applyQuickFixes();
  window.testBackend = testBackend;
  window.testAnalysis = testAnalysis;
  window.testComplet = testComplet;
  console.log([ECOLOJIA] Aide dev : testBackend(), testAnalysis(), testComplet());
}



