const dataCompletenessService = require("../services/dataCompleteness.service");

function enrichProduct(req, res, next) {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    try {
      if (data && data.product && typeof data.product === "object") {
        data.product.dataCompleteness = dataCompletenessService.calculateCompleteness(data.product);
      } else if (data && Array.isArray(data.products)) {
        data.products = data.products.map(p => {
          if (p && typeof p === "object") {
            p.dataCompleteness = dataCompletenessService.calculateCompleteness(p);
          }
          return p;
        });
      }
    } catch (err) {
      console.error("[ENRICH] Erreur:", err.message);
    }
    
    return originalJson(data);
  };
  
  next();
}

module.exports = enrichProduct;
