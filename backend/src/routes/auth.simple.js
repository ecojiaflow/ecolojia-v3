const express = require('express');
const router = express.Router();

console.log('🔐 Auth simple router loaded');

// Utilisateur test pour Chat IA
const TEST_USER = {
  _id: '1',
  email: 'test@ecolojia.com', 
  firstName: 'Test',
  lastName: 'User',
  subscription: { tier: 'premium', status: 'active' },
  quotas: { scansRemaining: 100 }
};

// GET /api/auth (test endpoint)
router.get('/', (req, res) => {
  console.log('✅ GET /api/auth called');
  res.json({ message: 'Auth endpoint accessible', routes: ['GET /', 'POST /login', 'POST /register'] });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  console.log('🔐 Login attempt:', req.body?.email);
  
  const { email, password } = req.body || {};
  
  // Accepter n'importe quel email/password pour test
  if (email && password) {
    const token = 'mock-token-' + Date.now();
    
    console.log('✅ Login success for:', email);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: { ...TEST_USER, email },
      token
    });
  } else {
    res.status(400).json({ error: 'Email and password required' });
  }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  console.log('📝 Register attempt:', req.body?.email);
  
  const { email, password, firstName } = req.body || {};
  
  if (email && password && firstName) {
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: { ...TEST_USER, email, firstName },
      token: 'mock-token-' + Date.now()
    });
  } else {
    res.status(400).json({ error: 'Email, password and firstName required' });
  }
});

console.log('🔐 Auth routes configured: GET /, POST /login, POST /register');

module.exports = router;
