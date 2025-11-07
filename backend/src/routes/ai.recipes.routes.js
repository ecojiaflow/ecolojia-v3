const express = require("express");
const router  = express.Router();
const { ping, suggest } = require("../controllers/ai/recipes.controller");

// Health simple du module
router.get("/health", ping);

// Suggestion de recettes basées sur un "product-like"
router.get("/suggest", suggest);
router.post("/suggest", suggest); // utile si on envoie un body JSON

module.exports = router;
