const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

/**
 * Email Verification Service
 * Handles sending verification codes and storing pending verifications
 */

class EmailVerificationService {
  constructor() {
    this.pendingVerifications = new Map(); // Store verification codes temporarily
    this.initializeTransport();
  }

  initializeTransport() {
    // Use environment variables for email configuration
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Only initialize if credentials are provided
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.initialized = true;
    } else {
      console.warn('Email service not configured. Verification codes will be logged to console.');
      this.initialized = false;
    }
  }

  /**
   * Generate a 6-digit verification code
   */
  generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send verification code to email
   */
  async sendVerificationCode(email) {
    try {
      const verificationCode = this.generateVerificationCode();
      const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store the verification code
      this.pendingVerifications.set(email, {
        code: verificationCode,
        expiresAt: expiryTime,
        attempts: 0
      });

      // If email service is configured, send the email
      if (this.initialized && this.transporter) {
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: email,
          subject: 'Email Verification Code - Dress Code Scanner',
          html: this.getEmailTemplate(verificationCode)
        };

        await this.transporter.sendMail(mailOptions);
        console.log(`✅ Verification code sent to ${email}`);
      } else {
        // Log to console for development/testing
        console.log(`📧 Verification code for ${email}: ${verificationCode}`);
      }

      return {
        success: true,
        message: 'Verification code sent to email',
        email: email
      };
    } catch (error) {
      console.error('Error sending verification code:', error);
      return {
        success: false,
        message: 'Failed to send verification code',
        error: error.message
      };
    }
  }

  /**
   * Verify the code provided by user
   */
  async verifyCode(email, code) {
    try {
      const verification = this.pendingVerifications.get(email);

      if (!verification) {
        return {
          success: false,
          message: 'No verification code found. Please request a new one.'
        };
      }

      // Check if code has expired
      if (Date.now() > verification.expiresAt) {
        this.pendingVerifications.delete(email);
        return {
          success: false,
          message: 'Verification code has expired. Please request a new one.'
        };
      }

      // Check if too many failed attempts
      if (verification.attempts >= 5) {
        this.pendingVerifications.delete(email);
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new code.'
        };
      }

      // Check if code matches
      if (verification.code !== code.toString()) {
        verification.attempts++;
        return {
          success: false,
          message: `Invalid code. ${5 - verification.attempts} attempts remaining.`
        };
      }

      // Code is valid - remove it and return success
      this.pendingVerifications.delete(email);
      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      console.error('Error verifying code:', error);
      return {
        success: false,
        message: 'Verification failed',
        error: error.message
      };
    }
  }

  /**
   * Get HTML template for verification email
   */
  getEmailTemplate(code) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { background-color: #1A1851; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #FCB315; text-align: center; padding: 20px; background-color: #f9f9f9; border-radius: 8px; letter-spacing: 5px; }
            .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Dress Code Scanner</h1>
              <p>Email Verification</p>
            </div>
            <p>Hello,</p>
            <p>Your verification code is:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <div class="footer">
              <p>&copy; 2025 Dress Code Scanner. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Check if email is verified (used to cache verification status)
   */
  isEmailVerified(email) {
    return !this.pendingVerifications.has(email);
  }

  /**
   * Clear expired codes
   */
  clearExpiredCodes() {
    const now = Date.now();
    for (const [email, verification] of this.pendingVerifications.entries()) {
      if (now > verification.expiresAt) {
        this.pendingVerifications.delete(email);
      }
    }
  }
}

// Create singleton instance
let emailService = null;

function getEmailVerificationService() {
  if (!emailService) {
    emailService = new EmailVerificationService();
    // Clear expired codes every 5 minutes
    setInterval(() => emailService.clearExpiredCodes(), 5 * 60 * 1000);
  }
  return emailService;
}

module.exports = {
  getEmailVerificationService,
  EmailVerificationService
};
