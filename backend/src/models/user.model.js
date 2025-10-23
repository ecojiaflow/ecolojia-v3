const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: false // Peut Ãªtre vide pour les utilisateurs crÃ©Ã©s via LemonSqueezy
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  registrationSource: {
    type: String,
    enum: ['web', 'mobile', 'lemonsqueezy', 'api'],
    default: 'web'
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  preferences: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Index pour performance
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);