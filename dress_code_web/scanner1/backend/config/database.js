const mongoose = require('mongoose');
require('dotenv').config();

let mainConnection = null;
let qrScannerConnection = null;

// Connect to main DB
const connectDB = async () => {
  try {
    mainConnection = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Main DB connected: ${mainConnection.connection.name}`);

    // Create indexes (your existing code)
    await createIndexes();
  } catch (error) {
    console.error('Main MongoDB connection error:', error);
    process.exit(1);
  }
};

// Separate QR Scanner DB connection
const getQrScannerDB = () => {
  if (!qrScannerConnection) {
    qrScannerConnection = mongoose.createConnection(process.env.QR_SCANNER_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`QR Scanner DB connected: ${process.env.QR_SCANNER_URI}`);
  }
  return qrScannerConnection;
};

// Create indexes (your existing function)
const createIndexes = async () => {
  try {
    const User = require('../models/User');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });

    const Violation = require('../models/Violation');
    await Violation.collection.createIndex({ studentName: 1 });
    await Violation.collection.createIndex({ date: -1 });
    await Violation.collection.createIndex({ status: 1 });
    await Violation.collection.createIndex({ createdAt: -1 });

    console.log('Indexes created successfully');
  } catch (error) {
    console.log('Index creation info:', error.message);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (qrScannerConnection) await qrScannerConnection.close();
    console.log('All MongoDB connections closed');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getQrScannerDB,   // <-- now properly exported
};
