# Email Verification & Password Complexity Implementation Guide

## Overview
This implementation adds two critical security features:
1. **Email Verification** - Superuser must verify email before creating new accounts
2. **Password Complexity** - All passwords must meet strict requirements (8+ chars, uppercase, lowercase, numbers)

---

## Backend Implementation

### 1. New Files Created

#### `backend/utils/passwordValidator.js`
- Validates password complexity requirements
- Enforces: Min 8 characters, uppercase, lowercase, numbers
- Returns detailed error messages

#### `backend/services/emailVerificationService.js`
- Manages email verification codes
- Supports both SMTP and console-based (testing) modes
- Generates 6-digit codes with 10-minute expiry
- Prevents brute force with attempt limiting (5 attempts max)

### 2. Updated Files

#### `backend/routes/auth.js`
- Login: Added password complexity validation
- Register: Added password complexity validation

#### `backend/routes/superuser.js`
- New endpoint: `POST /api/superuser/send-verification-code` - Sends code to email
- Updated endpoint: `POST /api/superuser/create-user` - Now requires verification code

#### `backend/models/User.js`
- Added `emailVerified` (Boolean) field
- Added `verifiedAt` (Date) field

---

## API Endpoints

### 1. Send Verification Code
```http
POST /api/superuser/send-verification-code
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com"
}
```

**Response:**
```json
{
  "message": "Verification code sent to email",
  "email": "newuser@example.com"
}
```

### 2. Create User (with verification)
```http
POST /api/superuser/create-user
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "john_doe",
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "role": "osa",
  "verificationCode": "123456"
}
```

**Response:**
```json
{
  "message": "✅ User john_doe created successfully as osa",
  "user": {
    "id": "...",
    "username": "john_doe",
    "email": "newuser@example.com",
    "role": "osa"
  }
}
```

### 3. Login (with password validation)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

---

## Password Requirements

All passwords must meet these requirements:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)

**Examples:**
- ✅ `SecurePass123` - Valid
- ✅ `Admin@2025` - Valid
- ❌ `password123` - No uppercase
- ❌ `Password` - No numbers
- ❌ `Pass1` - Too short

---

## Email Configuration

### Option 1: Using Gmail SMTP (Recommended for Production)

1. Enable 2-factor authentication on your Gmail account
2. Create an App Password at: https://myaccount.google.com/apppasswords
3. Add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Option 2: Using Other Email Providers

Update `.env` with your provider's SMTP settings. Example for Outlook:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Option 3: Testing Without Email (Development)

Leave email config commented in `.env`. Verification codes will be logged to console:
```
📧 Verification code for newuser@example.com: 123456
```

---

## Frontend Integration

### Create User Flow (Superuser Dashboard)

**Step 1: Email Verification**
```javascript
// Send verification code
async function sendVerificationCode(email) {
  const response = await fetch('/api/superuser/send-verification-code', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
  
  if (response.ok) {
    // Show code input field
    showCodeVerificationInput();
  }
}
```

**Step 2: Verify Code & Create User**
```javascript
// Create user with verified code
async function createUserWithVerification(username, email, password, role, code) {
  const response = await fetch('/api/superuser/create-user', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      email,
      password,
      role,
      verificationCode: code
    })
  });
  
  if (response.ok) {
    // User created successfully
    alert('User created successfully!');
  } else {
    const error = await response.json();
    alert(error.message);
  }
}
```

### Form Validation (Frontend)

```javascript
function validatePassword(password) {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password)
  };
  
  return Object.values(requirements).every(req => req);
}

// Show password requirements UI
function showPasswordRequirements(password) {
  const requirements = {
    'At least 8 characters': password.length >= 8,
    'Uppercase letter (A-Z)': /[A-Z]/.test(password),
    'Lowercase letter (a-z)': /[a-z]/.test(password),
    'Number (0-9)': /[0-9]/.test(password)
  };
  
  return requirements;
}
```

---

## Testing

### Test Email Verification Flow

1. **Start server** (with email config or console logging)
   ```bash
   cd backend
   node server.js
   ```

2. **Send verification code**
   ```bash
   curl -X POST http://localhost:3000/api/superuser/send-verification-code \
     -H "Authorization: Bearer <superuser-token>" \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

3. **Check console/email for code** (e.g., `123456`)

4. **Create user with code**
   ```bash
   curl -X POST http://localhost:3000/api/superuser/create-user \
     -H "Authorization: Bearer <superuser-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "SecurePass123",
       "role": "osa",
       "verificationCode": "123456"
     }'
   ```

### Test Password Validation

**Weak Password (should fail)**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "weak"}'
```

Response:
```json
{
  "error": "Password does not meet security requirements",
  "details": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter (A-Z)",
    "Password must contain at least one number (0-9)"
  ]
}
```

**Strong Password (should succeed)**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123"}'
```

---

## Default Test Accounts

After reset, test with:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| super_admin | superuser@example.com | SuperAdmin123 | superuser |
| osa_admin | osa@example.com | OsaAdmin123 | osa |
| security_guard | security@example.com | Security123 | security |

---

## Security Notes

⚠️ **Important:**
- Verification codes expire after 10 minutes
- Maximum 5 failed attempts before code resets
- Passwords are hashed using bcryptjs (10 salt rounds)
- All sensitive data is removed from JWT tokens
- Email service credentials should never be committed to git

---

## Error Handling

### Common Errors

**"Password does not meet complexity requirements"**
- Ensure password has 8+ chars, uppercase, lowercase, and a number

**"No verification code found"**
- Request a new code using the send-verification-code endpoint

**"Verification code has expired"**
- Codes expire after 10 minutes; request a new one

**"Email already in use"**
- Email must be unique; use a different email address

**"Too many failed attempts"**
- Request a new verification code
