const { suggestFromProduct } = require("../../services/ai/recipes.service");

const ping = async (req, res) => {
  return res.json({ ok: true, service: "ai/recipes", ts: new Date().toISOString() });
};

// GET /api/ai/recipes/suggest?name=...&categoryType=food|cosmetic|detergent
const suggest = async (req, res) => {
  try {
    const product = {
  name: req.query.name || (req.body && req.body.name),
  categoryType: normalizeCategory(
    req.query.categoryType || req.query.category ||
    (req.body && (req.body.categoryType || req.body.category))
  ),
};
    const recipes = suggestFromProduct(product);
    return res.json({ success: true, count: recipes.length, recipes });
  } catch (e) {
    return res.status(500).json({ success: false, error: e?.message || "unexpected_error" });
  }
};

const normalizeCategory = (raw) => {
  const s = String(raw || '').toLowerCase();
  if (s === 'cosmetics')  return 'cosmetic';
  if (s === 'detergents') return 'detergent';
  if (['food','cosmetic','detergent'].includes(s)) return s;
  return 'food';
};

module.exports = { ping, suggest };

