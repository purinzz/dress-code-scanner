const mongoose = require('mongoose');
const { getQrScannerDB } = require('../config/database');

// Use QR Scanner DB connection
const qrDb = getQrScannerDB();

const ReportSchema = new mongoose.Schema({
  student_info: String,
  violation: String,
  scanned_at: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
  isDeleted: { type: Boolean, default: false },
}, {
  collection: 'reports'
});

module.exports = qrDb.model('Report', ReportSchema);
