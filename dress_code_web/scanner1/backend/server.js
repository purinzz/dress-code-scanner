const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import database connections
const { connectDB, getQrScannerDB } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const violationRoutes = require('./routes/violations');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports'); // reports from qr_scanner_db

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Initialize database and models
async function initializeApp() {
  try {
    // Connect to dress_code_scanner DB
    await connectDB();

    // Connect to qr_scanner_db (for reports)
    await getQrScannerDB();

    // Import models after DB connections
    const User = require('./models/User');
    const Violation = require('./models/Violation');
    const Report = require('./models/Report'); // from qr_scanner_db

    // Create default users and sample data (only for main DB)
    await User.createDefaultUsers();
    await Violation.createSampleData();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes (main app + reports API)
app.use('/api/auth', authRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes); // connect reports endpoint

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (role) => {
    socket.join(role);
    console.log(`User joined ${role} room`);
  });
  
  socket.on('violation-detected', (data) => {
    io.to('security').emit('new-violation', data);
    console.log('Violation detected and broadcasted');
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/signup.html'));
});

app.get('/osa/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/osa/dashboard.html'));
});

app.get('/security/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/security/dashboard.html'));
});

// Start server after database initialization
async function startServer() {
  await initializeApp();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
    console.log(`Main DB connection: ${process.env.MONGODB_URI}`);
    console.log(`QR Scanner DB connection: ${process.env.QR_SCANNER_URI}`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  const { disconnectDB } = require('./config/database');
  await disconnectDB();
  process.exit(0);
});

// Start the application
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = { app, io };
