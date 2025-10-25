const express = require('express');
const Violation = require('../models/Violation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Violation.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent violations for monitoring
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const violations = await Violation.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(violations);
  } catch (error) {
    console.error('Error fetching recent violations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get violations by date for analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const violations = await Violation.find();

    // Group violations by date
    const violationsByDate = violations.reduce((acc, violation) => {
      const date = violation.date;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {});

    // Group violations by type
    const violationsByType = violations.reduce((acc, violation) => {
      const type = violation.violation;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {});

    res.json({
      violationsByDate,
      violationsByType,
      totalViolations: violations.length
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
