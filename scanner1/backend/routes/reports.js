const express = require('express');
const Report = require('../models/Report');
const router = express.Router();


// ===============================
// Get total violations (for dashboard card)
// ===============================
router.get('/stats', async (req, res) => {
  try {
    // Count only reports that are not soft deleted
    const total = await Report.countDocuments({ isDeleted: false });
    res.json({ total });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get all reports (for violations page)
// ===============================
// Get all reports (for violations page)
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    }).sort({ scanned_at: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// ===============================
// Update report status (OSA only)
// ===============================
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

// ===============================
// Soft delete a report (hide from OSA dashboard)
// ===============================
router.put('/soft-delete/:id', async (req, res) => {
  try {
    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Report hidden successfully', report: updated });
  } catch (error) {
    console.error('Error soft deleting report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's reports (for security dashboard)
router.get('/today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysReports = await Report.find({
      scanned_at: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: { $ne: true }
    }).sort({ scanned_at: -1 });

    res.json(todaysReports);
  } catch (error) {
    console.error('Error fetching today’s reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
