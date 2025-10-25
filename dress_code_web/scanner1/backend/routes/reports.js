const express = require('express');
const Report = require('../models/Report');
const router = express.Router();

// Get total violations (for dashboard card)
router.get('/stats', async (req, res) => {
  try {
    const total = await Report.countDocuments();
    res.json({ total });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reports (for violations page)
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ scanned_at: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report status (OSA only)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
