const express = require('express');
const Report = require('../models/Report');
const router = express.Router();

// Simple logging for incoming requests to this router (debugging PUT 404)
router.use((req, res, next) => {
  console.log(`[reports] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ===============================
// SPECIFIC NAMED ROUTES (must come BEFORE wildcard /:id routes)
// ===============================

// Debug: list report ids and timestamps to help trace UI vs DB
router.get('/debug/list-ids', async (req, res) => {
  try {
    const docs = await Report.find({}, { _id: 1, scanned_at: 1, violation: 1 }).sort({ scanned_at: -1 }).limit(100);
    res.json(docs.map(d => ({ _id: d._id, scanned_at: d.scanned_at, violation: d.violation })));
  } catch (err) {
    console.error('Error listing ids:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's reports (for security dashboard)
router.get('/today', async (req, res) => {
  try {
    // Get today's date in YYYY-MM-DD format (local timezone)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    // Create start and end of day in UTC
    const startOfDay = new Date(`${todayString}T00:00:00Z`);
    const endOfDay = new Date(`${todayString}T23:59:59Z`);

    console.log(`[/today] Fetching reports for ${todayString}`);
    console.log(`[/today] Query range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const todaysReports = await Report.find({
      scanned_at: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: { $ne: true }
    }).sort({ scanned_at: -1 });

    console.log(`[/today] Found ${todaysReports.length} reports`);
    res.json(todaysReports);
  } catch (error) {
    console.error('Error fetching today reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get total violations (for dashboard card)
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

// Soft delete a report (hide from OSA dashboard) - specific route before generic PUT /:id
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

// Attach image to report - specific route before generic PUT /:id
router.put('/:id/attach-image', async (req, res) => {
  try {
    const { image_id } = req.body;

    if (!image_id) {
      return res.status(400).json({ message: 'Image ID is required' });
    }

    const image_url = `/api/dashboard/image-proxy/${image_id}`;

    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { image_id, image_url },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Image attached successfully', report: updated });
  } catch (error) {
    console.error('Error attaching image to report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report status (OSA only) - specific route before generic PUT /:id
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
// GENERIC WILDCARD ROUTES (must come AFTER specific named routes)
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

// Get single report by ID
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report fields (e.g., violation)
router.put('/:id', async (req, res) => {
  try {
    const { violation } = req.body;

    if (typeof violation === 'undefined') {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { violation },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Report not found' });

    // Emit socket event so other dashboards (OSA) can refresh
    try {
      const io = req.app.get('io');
      if (io) io.to('osa').emit('violation-updated', { id: updated._id });
    } catch (e) {
      console.error('Failed to emit socket event for report update', e);
    }

    res.json({ message: 'Report updated', report: updated });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
