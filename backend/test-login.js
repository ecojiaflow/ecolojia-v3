// backend/test-login.js
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

async function testLogin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Récupérer l'utilisateur
    const User = require('./src/models/User');
    const user = await User.findOne({ email: 'demo@test.com' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ User found:', user.email);
    console.log('📧 Email verified:', user.emailVerified);
    
    // Tester le mot de passe
    const isValid = await bcrypt.compare('Demo123!', user.password);
    console.log('🔐 Password valid:', isValid);
    
    // Tester avec la méthode du modèle
    const isValidMethod = await user.comparePassword('Demo123!');
    console.log('🔐 Password valid (method):', isValidMethod);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLogin();