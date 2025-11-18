const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

// Database
const { connectDB, getQrScannerDB } = require('./config/database');

// Services
const { initializeGoogleDrive } = require('./services/googleDriveService');

// Routes
const authRoutes = require('./routes/auth');
const violationRoutes = require('./routes/violations');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const superuserRoutes = require('./routes/superuser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET","POST"] } });
app.set('io', io);
const PORT = process.env.PORT || 3000;

// Initialize DB
async function initializeApp() {
  try {
    await connectDB();
    await getQrScannerDB();
    const User = require('./models/User');
    const Violation = require('./models/Violation');
    await User.createDefaultUsers();
    await Violation.createSampleData();
    
    // Initialize Google Drive service
    const { service, success } = await initializeGoogleDrive();
    if (success && process.env.GOOGLE_DRIVE_FOLDER_ID) {
      service.setFolderId(process.env.GOOGLE_DRIVE_FOLDER_ID);
      console.log("Google Drive service initialized successfully");
    } else {
      console.log("Google Drive service not configured or initialization failed");
    }
    
    console.log("Application initialized successfully");
  } catch (err) {
    console.error("Failed to initialize app:", err);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes **before** any wildcard frontend routes
app.use('/api/auth', authRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/superuser', superuserRoutes);

// Multer for uploads
const upload = multer({ dest: 'uploads/' });

// Upload violation image
app.post('/api/security/violation', upload.single('image'), async (req, res) => {
  try {
    const { studentId, violationType } = req.body;
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname);
    const fileName = req.file.filename + fileExt;
    fs.renameSync(filePath, `uploads/${fileName}`);
    const imageUrl = `/uploads/${fileName}`;

    const Violation = require('./models/Violation');
    const violation = await Violation.create({
      studentId,
      violationType,
      imageUrl,
      timestamp: new Date(),
      status: 'pending'
    });

    // Update latest image in dashboard
    const dashboard = require('./routes/dashboard');
    dashboard.setLatestViolationImage(imageUrl);

    // Notify via socket.io
    io.to('security').emit('new-violation', violation);
    res.json({ success: true, violation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload violation' });
  }
});

// Fetch recent violations
app.get('/api/security/violations/recent', async (req, res) => {
  try {
    const Violation = require('./models/Violation');
    const recent = await Violation.find().sort({ timestamp: -1 }).limit(10);
    res.json(recent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch violations' });
  }
});

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-room', (role) => { socket.join(role); });
  socket.on('violation-detected', (data) => { io.to('security').emit('new-violation', data); });
  socket.on('violation-updated', (data) => { io.to('osa').emit('violation-updated', data); });
  socket.on('disconnect', () => { console.log('User disconnected:', socket.id); });
});

// Serve frontend pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, '../frontend/signup.html')));
app.get('/osa/*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/osa/dashboard.html')));
app.get('/security/*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/security/dashboard.html')));

// Start server
async function startServer() {
  await initializeApp();
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  const { disconnectDB } = require('./config/database');
  await disconnectDB();
  process.exit(0);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { app, io };
