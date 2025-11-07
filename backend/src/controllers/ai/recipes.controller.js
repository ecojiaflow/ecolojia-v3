const { suggestFromProduct } = require("../../services/ai/recipes.service");

const ping = async (req, res) => {
  return res.json({ ok: true, service: "ai/recipes", ts: new Date().toISOString() });
};

// GET /api/ai/recipes/suggest?name=...&categoryType=food|cosmetic|detergent
const suggest = async (req, res) => {
  try {
    const product = {
      name: req.query.name || req.body?.name,
      categoryType: req.query.categoryType || req.body?.categoryType || "food",
    };
    const recipes = suggestFromProduct(product);
    return res.json({ success: true, count: recipes.length, recipes });
  } catch (e) {
    return res.status(500).json({ success: false, error: e?.message || "unexpected_error" });
  }
};

module.exports = { ping, suggest };
