// backend/fix-user.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('âœ… Connected to MongoDB');
    
    // Supprimer l'ancien user
    await User.deleteOne({ email: 'demo@test.com' });
    console.log('ðŸ—‘ï¸ Old user deleted');
    
    // CrÃ©er un nouveau user (le modÃ¨le hashera automatiquement le mot de passe)
    const user = new User({
      email: 'demo@test.com',
      password: 'Demo123!', // PAS de hash ici, le modÃ¨le le fera
      name: 'Demo User',
      profile: { firstName: 'Demo', lastName: 'User' },
      tier: 'free',
      status: 'active',
      emailVerified: true,
      quotas: {
        scansRemaining: 30,
        scansResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        aiChatsRemaining: 5,
        aiChatsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    await user.save();
    console.log('âœ… User created successfully');
    
    // Tester la connexion
    const isValid = await user.comparePassword('Demo123!');
    console.log('ðŸ” Password test:', isValid ? 'âœ… OK' : 'âŒ Failed');
    
    process.exit(0);
  } catch (error) {
    console.error('âŒ Error:', error);
    process.exit(1);
  }
}

createTestUser();