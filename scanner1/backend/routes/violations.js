const express = require('express');
const multer = require('multer');
const path = require('path');
const Violation = require('../models/Violation');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'violation-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ✅ NEW: Summary route
router.get('/summary/count', authenticateToken, authorizeRole(['osa']), async (req, res) => {
  try {
    const totalViolations = await Violation.countDocuments({});
    const pending = await Violation.countDocuments({ status: 'pending' });
    const resolved = await Violation.countDocuments({ status: 'resolved' });

    res.json({
      total: totalViolations,
      pending: pending,
      resolved: resolved
    });
  } catch (error) {
    console.error('Error fetching violation summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all violations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, startDate, endDate, search } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    if (search) {
      const searchString = Array.isArray(search) ? search[0] : search;
      query.$or = [
        { studentName: { $regex: searchString, $options: 'i' } },
        { violation: { $regex: searchString, $options: 'i' } },
        { course: { $regex: searchString, $options: 'i' } }
      ];
    }

    query.isDeleted = false; // show only active ones
    const violations = await Violation.find(query).sort({ createdAt: -1 });
    res.json(violations);
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get violation by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);
    if (!violation) {
      return res.status(404).json({ error: 'Violation not found' });
    }
    res.json(violation);
  } catch (error) {
    console.error('Error fetching violation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new violation (Security only)
router.post('/', authenticateToken, authorizeRole(['security']), upload.single('image'), async (req, res) => {
  try {
    const { studentName, yearLevel, course, violation, date, time } = req.body;

    if (!studentName || !violation) {
      return res.status(400).json({ error: 'Student name and violation are required' });
    }

    const newViolation = new Violation({
      studentName: studentName.trim(),
      yearLevel: yearLevel ? yearLevel.trim() : '',
      course: course ? course.trim() : '',
      violation: violation.trim(),
      date: date || new Date().toISOString().split('T')[0],
      time: time || new Date().toLocaleTimeString(),
      status: 'pending',
      image: req.file ? `/uploads/${req.file.filename}` : null,
      detectedBy: req.user.username
    });

    await newViolation.save();

    const { io } = require('../server');
    if (io) {
      io.to('osa').emit('new-violation', newViolation);
      io.to('security').emit('violation-logged', newViolation);
    }

    res.status(201).json(newViolation);
  } catch (error) {
    console.error('Error creating violation:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Update violation
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, studentName, yearLevel, course, violation, date } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (studentName) updateData.studentName = studentName;
    if (yearLevel) updateData.yearLevel = yearLevel;
    if (course) updateData.course = course;
    if (violation) updateData.violation = violation;
    if (date) updateData.date = date;

    if (status === 'resolved') {
      updateData.resolvedBy = req.user.username;
      updateData.resolvedAt = new Date();
    }

    const updatedViolation = await Violation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedViolation) {
      return res.status(404).json({ error: 'Violation not found' });
    }

    res.json(updatedViolation);
  } catch (error) {
    console.error('Error updating violation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🟠 Soft delete violation (OSA only)
router.put('/soft-delete/:id', authenticateToken, authorizeRole(['osa']), async (req, res) => {
  try {
    const violation = await Violation.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!violation) {
      return res.status(404).json({ error: 'Violation not found' });
    }

    res.json({ message: 'Violation hidden from OSA dashboard', violation });
  } catch (error) {
    console.error('Error soft-deleting violation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Delete violation
router.delete('/:id', authenticateToken, authorizeRole(['osa', 'security']), async (req, res) => {
  try {
    const deletedViolation = await Violation.findByIdAndDelete(req.params.id);
    if (!deletedViolation) {
      return res.status(404).json({ error: 'Violation not found' });
    }
    res.json({ message: 'Violation deleted successfully' });
  } catch (error) {
    console.error('Error deleting violation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
