// middleware/auth.js
console.log('[DEBUG] JWT_SECRET utilisÃ© =', process.env.JWT_SECRET);
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'ClÃ© API requise',
      code: 'MISSING_API_KEY' 
    });
  }

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ 
      error: 'ClÃ© API invalide',
      code: 'INVALID_API_KEY' 
    });
  }

  next();
};

module.exports = { validateApiKey };