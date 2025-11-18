const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validatePasswordComplexity } = require('../utils/passwordValidator');
require('dotenv').config();

const router = express.Router();

// ===============================
// Register new user
// ===============================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password complexity
    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet complexity requirements',
        details: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // ✅ Allow all three roles
    if (!['osa', 'security', 'superuser'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===============================
// Login user
// ===============================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password complexity and warn if weak (but allow login)
    const passwordValidation = validatePasswordComplexity(password);
    const hasWeakPassword = !passwordValidation.isValid;

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log(`✅ ${user.role} "${user.username}" logged in successfully.`);

    const response = {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };

    // Warn if password is weak but don't block login
    if (hasWeakPassword) {
      response.warning = 'Your password does not meet current security requirements. Please update it soon.';
      response.passwordRequirements = passwordValidation.errors;
    }

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
