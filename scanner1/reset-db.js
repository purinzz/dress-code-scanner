#!/usr/bin/env node

/**
 * Reset Database Script
 * Clears all users and recreates them with strong passwords
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const User = require('./backend/models/User');

async function resetDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');
    console.log('Clearing existing users...');
    
    await User.deleteMany({});
    console.log('✅ All users deleted');

    console.log('\nCreating default users with strong passwords...');
    await User.createDefaultUsers();

    console.log('\n✅ Database reset successfully!');
    console.log('\nDefault Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: super_admin');
    console.log('Email:    super@school.local');
    console.log('Password: SuperAdmin@2025');
    console.log('Role:     superuser');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: osa_admin');
    console.log('Email:    osa@school.edu');
    console.log('Password: SuperAdmin@2025');
    console.log('Role:     osa');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: security_guard');
    console.log('Email:    security@school.edu');
    console.log('Password: SuperAdmin@2025');
    console.log('Role:     security');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetDatabase();
