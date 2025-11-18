/**
 * Password validation utility
 * Enforces password complexity requirements
 */

/**
 * Validate password complexity
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
function validatePasswordComplexity(password) {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password)
  };

  const isValid = Object.values(requirements).every(req => req);

  return {
    isValid,
    requirements,
    errors: getPasswordErrors(requirements)
  };
}

/**
 * Get user-friendly error messages
 */
function getPasswordErrors(requirements) {
  const errors = [];

  if (!requirements.minLength) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!requirements.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }
  if (!requirements.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }
  if (!requirements.hasNumber) {
    errors.push('Password must contain at least one number (0-9)');
  }

  return errors;
}

module.exports = {
  validatePasswordComplexity,
  getPasswordErrors
};
