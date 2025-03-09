const mongoose = require('mongoose');

// MongoDB Connection
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/FashionNest';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    if (conn.connection.host) {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log('MongoDB Connected to:', mongoURI);
    }
    
    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

module.exports = connectDB; 