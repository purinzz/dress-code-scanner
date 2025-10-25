const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['osa', 'security'],
    default: 'security'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to create default admin users
userSchema.statics.createDefaultUsers = async function() {
  try {
    const existingUsers = await this.countDocuments();
    if (existingUsers === 0) {
      const defaultPassword = await bcrypt.hash('password', 10);

      const defaultUsers = [
        {
          username: 'osa_admin',
          email: 'osa@school.edu',
          password: defaultPassword,
          role: 'osa'
        },
        {
          username: 'security_guard',
          email: 'security@school.edu',
          password: defaultPassword,
          role: 'security'
        }
      ];

      await this.insertMany(defaultUsers);
      console.log('Default users created successfully');
    }
  } catch (error) {
    console.error('Error creating default users:', error);
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
