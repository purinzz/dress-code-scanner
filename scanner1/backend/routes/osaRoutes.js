const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// @desc Get dashboard stats (total reports)
router.get('/dashboard/stats', async (req, res) => {
  try {
    const total = await Report.countDocuments();
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc Get all violations
router.get('/violations', async (req, res) => {
  try {
    const reports = await Report.find().sort({ scanned_at: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc Update violation status
router.put('/violations/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Report not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
