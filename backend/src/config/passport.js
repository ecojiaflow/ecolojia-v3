const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialisation user (stockage session)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialisation user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Strategie Google OAuth 2.0
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID_OAUTH,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_OAUTH,
      callbackURL: '/api/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔐 [Google OAuth] Profile reçu:', profile.id);

        // Chercher user existant avec Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          console.log('✅ [Google OAuth] User existant trouve:', user._id);
          return done(null, user);
        }

        // Chercher user existant avec meme email
        const existingEmailUser = await User.findOne({
          email: profile.emails[0].value,
        });

        if (existingEmailUser) {
          // Lier compte Google au compte existant
          console.log('🔗 [Google OAuth] Liaison compte existant:', existingEmailUser._id);
          existingEmailUser.googleId = profile.id;
          existingEmailUser.avatar = profile.photos[0]?.value;
          await existingEmailUser.save();
          return done(null, existingEmailUser);
        }

        // Creer nouveau user
        console.log('🆕 [Google OAuth] Creation nouveau user');
        const newUser = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0]?.value,
          password: 'GOOGLE_OAUTH',
          emailVerified: true,
          plan: {
            code: 'free',
            startDate: new Date(),
          },
          limits: {
            scansPerMonth: 30,
            aiChatsPerMonth: 5,
          },
          usage: {
            scans: 0,
            aiChats: 0,
          },
        });

        console.log('✅ [Google OAuth] User cree:', newUser._id);
        done(null, newUser);
      } catch (error) {
        console.error('❌ [Google OAuth] Erreur:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;