// PATH: backend/src/scripts/migrateUsersV2.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const logger = {
  info: (...args) => console.log('[Migration]', ...args),
  error: (...args) => console.error('[Migration ERROR]', ...args),
  success: (...args) => console.log('âœ…', ...args)
};

async function migrateUsers() {
  try {
    // Connexion MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Recuperer tous les utilisateurs
    const users = await User.find({});
    logger.info(`Found ${users.length} users to migrate`);

    let migrated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        let needsUpdate = false;

        // Initialiser les nouveaux champs s'ils n'existent pas
        if (!user.plan) {
          user.plan = {
            code: user.tier || 'free',
            status: 'active',
            startedAt: user.createdAt || new Date()
          };
          needsUpdate = true;
        }

        if (!user.limits) {
          switch (user.plan.code) {
            case 'premium':
              user.limits = {
                scansPerMonth: 1000,
                aiChatsPerMonth: 500,
                exportsPerMonth: 50,
                favoritesMax: 200
              };
              break;
            case 'family':
              user.limits = {
                scansPerMonth: 5000,
                aiChatsPerMonth: 2000,
                exportsPerMonth: 200,
                favoritesMax: 1000
              };
              break;
            default:
              user.limits = {
                scansPerMonth: 30,
                aiChatsPerMonth: 5,
                exportsPerMonth: 1,
                favoritesMax: 20
              };
          }
          needsUpdate = true;
        }

        if (!user.usage) {
          const now = new Date();
          user.usage = {
            currentPeriodStart: now,
            currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
            scansUsed: 0,
            aiChatsUsed: 0,
            exportsUsed: 0
          };
          needsUpdate = true;
        }

        if (!user.profile) {
          user.profile = {
            newsletter: false,
            location: {}
          };
          needsUpdate = true;
        }

        if (!user.aiPrefs) {
          user.aiPrefs = {
            tone: 'educational',
            detail: 'balanced',
            language: 'fr',
            focusAreas: [],
            foodRestrictions: [],
            allergies: [],
            autoSuggest: true,
            saveHistory: true
          };
          needsUpdate = true;
        }

        if (!user.preferences) {
          user.preferences = {
            theme: 'light',
            notifications: {
              email: true,
              push: false,
              sms: false
            },
            privacy: {
              shareAnalytics: true,
              publicProfile: false
            },
            displayUnits: {
              weight: 'metric',
              energy: 'kcal'
            }
          };
          needsUpdate = true;
        }

        if (!user.stats) {
          user.stats = {
            totalScans: user.scanCount || 0,
            totalAiChats: 0,
            totalExports: 0,
            favoriteProducts: 0,
            joinedAt: user.createdAt || new Date()
          };
          needsUpdate = true;
        }

        // Sauvegarder si des modifications ont ete faites
        if (needsUpdate) {
          await user.save();
          migrated++;
          logger.success(`User ${user.email} migrated`);
        }

      } catch (error) {
        errors++;
        logger.error(`Failed to migrate user ${user.email}:`, error.message);
      }
    }

    logger.info('=================================');
    logger.success(`Migration completed!`);
    logger.info(`Total users: ${users.length}`);
    logger.info(`Migrated: ${migrated}`);
    logger.info(`Errors: ${errors}`);
    logger.info(`Already up-to-date: ${users.length - migrated - errors}`);

  } catch (error) {
    logger.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Executer la migration
migrateUsers();