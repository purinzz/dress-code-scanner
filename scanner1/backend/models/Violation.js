const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    maxlength: [100, 'Student name cannot exceed 100 characters']
  },
  yearLevel: {
    type: String,
    trim: true,
    maxlength: [50, 'Year level cannot exceed 50 characters']
  },
  course: {
    type: String,
    trim: true,
    maxlength: [50, 'Course cannot exceed 50 characters']
  },
  violation: {
    type: String,
    required: [true, 'Violation type is required'],
    trim: true,
    maxlength: [200, 'Violation description cannot exceed 200 characters']
  },
  date: {
    type: String,
    required: [true, 'Date is required']
  },
  time: {
    type: String,
    default: function() {
      return new Date().toLocaleTimeString();
    }
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'not yet resolved'],
    default: 'pending'
  },
  image: {
    type: String,
    default: null
  },
  detectedBy: {
    type: String,
    required: [true, 'Detected by is required']
  },
  resolvedBy: {
    type: String,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isDeleted: {
  type: Boolean,
  default: false
}
}, {
  timestamps: true
});

// Indexes for better query performance
violationSchema.index({ studentName: 1 });
violationSchema.index({ date: -1 });
violationSchema.index({ status: 1 });
violationSchema.index({ createdAt: -1 });
violationSchema.index({ detectedBy: 1 });

// Static method to create sample data
violationSchema.statics.createSampleData = async function() {
  try {
    const existingViolations = await this.countDocuments();
    if (existingViolations === 0) {
      const sampleViolations = [
        {
          studentName: 'Anna Cruz',
          yearLevel: 'Second Year',
          course: 'CE',
          violation: 'Croptop',
          date: '2025-05-02',
          time: '4:00 PM',
          status: 'not yet resolved',
          image: '/uploads/sample1.jpg',
          detectedBy: 'security_guard'
        },
        {
          studentName: 'Jhon Doe',
          yearLevel: 'First Year',
          course: 'IT',
          violation: 'Tattered Jeans',
          date: '2025-05-02',
          time: '4:01 PM',
          status: 'resolved',
          image: '/uploads/sample2.jpg',
          detectedBy: 'security_guard',
          resolvedBy: 'osa_admin',
          resolvedAt: new Date()
        },
        {
          studentName: 'Jason Fabria',
          yearLevel: 'Third Year',
          course: 'IT',
          violation: 'Rubber Slipper',
          date: '2025-05-04',
          time: '4:02 PM',
          status: 'pending',
          image: '/uploads/sample3.jpg',
          detectedBy: 'security_guard'
        },
        {
          studentName: 'Miles Cristi Cabamac',
          yearLevel: 'Third Year',
          course: 'IT',
          violation: 'Short shorts',
          date: '2025-05-06',
          time: '4:03 PM',
          status: 'not yet resolved',
          image: '/uploads/sample4.jpg',
          detectedBy: 'security_guard'
        }
      ];

      await this.insertMany(sampleViolations);
      console.log('Sample violation data created successfully');
    }
  } catch (error) {
    console.error('Error creating sample violations:', error);
  }
};

// Static method to get violation statistics
violationSchema.statics.getStats = async function() {
  try {
    const total = await this.countDocuments();
    const resolved = await this.countDocuments({ status: 'resolved' });
    const pending = await this.countDocuments({ status: 'pending' });
    const notResolved = await this.countDocuments({ status: 'not yet resolved' });

    return {
      total,
      resolved,
      pending,
      notResolved
    };
  } catch (error) {
    console.error('Error getting violation stats:', error);
    return { total: 0, resolved: 0, pending: 0, notResolved: 0 };
  }
};

// Static method to find violations by date range
violationSchema.statics.findByDateRange = async function(startDate, endDate) {
  try {
    return await this.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error finding violations by date range:', error);
    return [];
  }
};

// Pre-save middleware to update resolvedAt when status changes to resolved
violationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

const Violation = mongoose.model('Violation', violationSchema);

module.exports = Violation;
