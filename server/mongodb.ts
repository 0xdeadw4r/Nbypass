import mongoose from 'mongoose';

export async function connectToMongoDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    console.log('ℹ️  Please set MONGODB_URI with your MongoDB connection string');
    console.log('ℹ️  Example: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
    throw new Error('MONGODB_URI is required');
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('\nℹ️  Please check:');
    console.log('   1. Your MongoDB connection string is correct');
    console.log('   2. Your IP address is whitelisted in MongoDB Atlas');
    console.log('   3. Username and password are included in the connection string');
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

export default mongoose;
