const mongoose = require('mongoose');
const { getQrScannerDB } = require('../config/database');

// Use QR Scanner DB connection
const qrDb = getQrScannerDB();

const ReportSchema = new mongoose.Schema({
  student_info: String,
  violation: String,
  scanned_at: { type: Date, default: Date.now },
  submitted_by: { type: String, default: null }, // Who submitted the report
  status: { type: String, default: 'pending' },
  image_id: { type: String, default: null }, // Google Drive file ID for violation image
  image_url: { type: String, default: null }, // Cached image proxy URL
  isDeleted: { type: Boolean, default: false },
}, {
  collection: 'reports'
});

module.exports = qrDb.model('Report', ReportSchema);
