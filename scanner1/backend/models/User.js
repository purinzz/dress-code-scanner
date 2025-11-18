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
    match: [/^[\w.+-]+@([\w-]+\.)+[\w-]{2,}$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['osa', 'security', 'superuser'],
    default: 'security'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

// Instance method to check passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to create default users (including superuser)
userSchema.statics.createDefaultUsers = async function () {
  try {
    const count = await this.countDocuments();
    if (count === 0) {
      // Strong default passwords meeting complexity requirements
      const defaultPassword = await bcrypt.hash('SuperAdmin@2025', 10);

      const defaultUsers = [
        {
          username: 'super_admin',
          email: 'super@school.local',
          password: defaultPassword,
          role: 'superuser',
          emailVerified: true,
          verifiedAt: new Date()
        },
        {
          username: 'osa_admin',
          email: 'osa@school.edu',
          password: defaultPassword,
          role: 'osa',
          emailVerified: true,
          verifiedAt: new Date()
        },
        {
          username: 'security_guard',
          email: 'security@school.edu',
          password: defaultPassword,
          role: 'security',
          emailVerified: true,
          verifiedAt: new Date()
        }
      ];

      await this.insertMany(defaultUsers);
      console.log('✅ Default users (including superuser) created successfully');
      console.log('   📝 Default Password: SuperAdmin@2025');
    } else {
      // Ensure superuser exists even if others were created earlier
      const superExists = await this.findOne({ role: 'superuser' });
      if (!superExists) {
        const superPass = await bcrypt.hash('SuperAdmin@2025', 10);
        await this.create({
          username: 'super_admin',
          email: 'super@school.local',
          password: superPass,
          role: 'superuser',
          emailVerified: true,
          verifiedAt: new Date()
        });
        console.log('✅ Superuser account created successfully');
      }
    }
  } catch (error) {
    console.error('❌ Error creating default users:', error);
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
