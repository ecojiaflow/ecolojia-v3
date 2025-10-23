// backend/src/config/mongodb.ts
import mongoose from 'mongoose';

export const connectMongoDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Options de connexion recommandÃ©es
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    await mongoose.connect(uri, options);
    
    console.log('âœ… MongoDB Atlas connected successfully');
    console.log(`ðŸ“ Connected to database: ${mongoose.connection.db?.databaseName || "ecolojia"}`);
    
    // Event listeners pour monitoring
    mongoose.connection.on('error', (error) => {
      console.error('âŒ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('âš ï¸ MongoDB disconnected');
    });

  } catch (error) {
    console.error('âŒ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};
