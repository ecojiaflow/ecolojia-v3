const express = require('express');
const router = express.Router();

// Auth simple pour développement et production
router.get('/', (req, res) => {
  res.json({ 
    message: 'Auth API available', 
    status: 'ready',
    endpoints: ['/login', '/logout', '/verify']
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Auth simple : accepter n'importe quels identifiants
  if (email && password) {
    const user = {
      id: 1,
      email: email,
      name: email.split('@')[0],
      plan: 'premium' // Donner accès premium pour tests
    };
    
    const token = 'dev-token-' + Date.now();
    
    res.json({
      success: true,
      user,
      token,
      message: 'Connexion réussie'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email et mot de passe requis'
    });
  }
});

router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Déconnexion réussie' 
  });
});

// Middleware de vérification token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && token.startsWith('dev-token-')) {
    res.json({
      success: true,
      user: {
        id: 1,
        email: 'user@test.com',
        name: 'Test User',
        plan: 'premium'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
});


// Route profile (pour le frontend)
router.get('/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && token.startsWith('dev-token-')) {
    res.json({
      success: true,
      user: {
        id: 1,
        email: 'user@test.com',
        name: 'Test User',
        plan: 'premium'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
});

module.exports = router;

