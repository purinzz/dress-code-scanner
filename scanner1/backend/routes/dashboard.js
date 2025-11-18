const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Violation = require('../models/Violation');
const path = require('path');
const https = require('https');
const { getGoogleDriveService } = require('../services/googleDriveService');

const router = express.Router();

// Store latest uploaded image (relative path or URL)
let latestViolationImage = "";

// Setter function to update latest image from server.js
function setLatestViolationImage(url) {
  latestViolationImage = url;
}
module.exports.setLatestViolationImage = setLatestViolationImage;

/* ===========================================================
   PUBLIC ROUTES (NO TOKEN REQUIRED)
   =========================================================== */

// Get latest image - public
router.get('/latest-image', async (req, res) => {
  try {
    // Try to get from Google Drive first
    const gdrive = getGoogleDriveService();
    if (gdrive.isInitialized()) {
      const latestFromDrive = await gdrive.getLatestImage();
      if (latestFromDrive) {
        return res.json({ 
          imageUrl: `/api/dashboard/image-proxy/${latestFromDrive.id}`,
          source: 'gdrive',
          metadata: latestFromDrive 
        });
      }
    }

    // Fallback to stored latest image from server
    if (latestViolationImage) {
      return res.json({ 
        imageUrl: latestViolationImage,
        source: 'server'
      });
    }

    // Final fallback - return a placeholder
    return res.json({ 
      imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="18" fill="%23999" text-anchor="middle" dy=".3em"%3ENo image available%3C/text%3E%3C/svg%3E',
      source: 'placeholder'
    });
  } catch (error) {
    console.error('Error fetching latest image:', error);
    res.status(500).json({ error: 'Failed to fetch latest image' });
  }
});

// Proxy endpoint to fetch images from Google Drive
router.get('/image-proxy/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const gdrive = getGoogleDriveService();
    
    if (!gdrive.isInitialized()) {
      return res.status(503).json({ error: 'Google Drive service not available' });
    }

    // Fetch the image from Google Drive and stream it
    const drive = gdrive.getDrive();
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // Set proper headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Pipe the stream to response
    response.data.pipe(res);
    response.data.on('error', (err) => {
      console.error('Error streaming image:', err);
      res.status(500).json({ error: 'Failed to fetch image' });
    });
  } catch (error) {
    console.error('Error in image proxy:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// Optional: update latest image manually (for testing)
router.post('/update-image', (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "No image URL provided" });
  }

  latestViolationImage = imageUrl;
  console.log("Latest image updated:", imageUrl);
  res.json({ success: true, imageUrl });
});

/* ===========================================================
   PROTECTED ROUTES (TOKEN REQUIRED)
   =========================================================== */
router.use(authenticateToken);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Violation.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent violations for monitoring
router.get('/recent', async (req, res) => {
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
router.get('/analytics', async (req, res) => {
  try {
    const violations = await Violation.find();

    const violationsByDate = violations.reduce((acc, violation) => {
      const date = violation.date;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const violationsByType = violations.reduce((acc, violation) => {
      const type = violation.violation;
      acc[type] = (acc[type] || 0) + 1;
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
