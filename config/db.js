import mongoose from "mongoose";

/**
 * Connects to MongoDB using environment variables
 * Make sure your .env file has:
 * MONGO_URI=mongodb://localhost:27017/your-database-name
 * or for MongoDB Atlas:
 * MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // console.log("✅ MongoDB connected successfully");


    // console.log(`📍 chatApp ${conn.connection.host}`);
    // console.log(`📊 Database: ${conn.connection.name}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Stack trace:", err.stack);
    process.exit(1); // Exit process with failure
  }
};

/**
 * Closes the MongoDB connection gracefully
 */
export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    // console.log("👋 MongoDB connection closed");
  } catch (err) {
    console.error("❌ Error closing MongoDB connection:", err.message);
  }
};

/**
 * Handle MongoDB connection events
 */
mongoose.connection.on('disconnected', () => {
  // console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  // console.log('🔄 MongoDB reconnected');
});