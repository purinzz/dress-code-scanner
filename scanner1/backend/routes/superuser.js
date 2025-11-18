const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { authenticateToken } = require("../middleware/auth");
const { checkSuperuser } = require("../middleware/roleCheck");
const { getEmailVerificationService } = require("../services/emailVerificationService");
const { validatePasswordComplexity } = require("../utils/passwordValidator");

const router = express.Router();

/* 🟢 Connect specifically to the dress_code_scanner database */
const userDB = mongoose.createConnection("mongodb://127.0.0.1:27017/dress_code_scanner", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

/* ✅ Import the User schema using the correct connection */
const User = userDB.model("User", require("../models/User").schema);

userDB.on("connected", () => {
  console.log("✅ Connected to dress_code_scanner database (for superuser routes)");
});

userDB.on("error", (err) => {
  console.error("❌ dress_code_scanner DB connection error:", err);
});

console.log("📁 Superuser routes file initialized");

/* -----------------------------------------------------
 * 🧩 ROUTES
 * ---------------------------------------------------*/

/**
 * 📧 Step 1: Send verification code to email
 */
router.post("/send-verification-code", authenticateToken, checkSuperuser, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if email already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    const emailService = getEmailVerificationService();
    const result = await emailService.sendVerificationCode(email);

    if (!result.success) {
      return res.status(500).json({ message: result.message });
    }

    res.json({ 
      message: "Verification code sent to email",
      email: email
    });
  } catch (error) {
    console.error("Error sending verification code:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ Step 2: Verify code and create user
 */
router.post("/create-user", authenticateToken, checkSuperuser, async (req, res) => {
  try {
    const { username, email, password, role, verificationCode } = req.body;

    if (!username || !email || !password || !role || !verificationCode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["osa", "security"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Only 'osa' or 'security' allowed." });
    }

    // Validate password complexity
    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: "Password does not meet complexity requirements",
        details: passwordValidation.errors
      });
    }

    // Verify the email code
    const emailService = getEmailVerificationService();
    const verifyResult = await emailService.verifyCode(email, verificationCode);

    if (!verifyResult.success) {
      return res.status(400).json({ message: verifyResult.message });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // Create the user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      role, 
      isActive: true,
      emailVerified: true,
      verifiedAt: new Date()
    });
    await newUser.save();

    res.json({ 
      message: `✅ User ${username} created successfully as ${role}`,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * 📋 Get all users (except the superuser themself)
 */
router.get("/users", authenticateToken, checkSuperuser, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "superuser" } }).select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✏️ Update user role
 */
router.patch("/users/:id/role", authenticateToken, checkSuperuser, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["osa", "security"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'osa' or 'security'." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found." });

    res.json({ message: "✅ Role updated successfully.", user: updatedUser });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ❌ Delete user
 */
router.delete("/users/:id", authenticateToken, checkSuperuser, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "User not found." });

    res.json({ message: `🗑️ User '${deletedUser.username}' deleted successfully.` });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
