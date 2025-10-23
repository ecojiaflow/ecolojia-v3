// fix-quotas.js
const mongoose = require('mongoose');
require('dotenv').config();

async function fixQuotas() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const User = require('./src/models/User');
  
  // RÃ©initialiser les quotas du compte demo
  await User.updateOne(
    { email: 'demo@test.com' },
    { 
      $set: { 
        'quotas.aiChatsRemaining': 5,
        'quotas.scansRemaining': 30
      }
    }
  );
  
  console.log('âœ… Quotas rÃ©initialisÃ©s');
  process.exit(0);
}

fixQuotas();