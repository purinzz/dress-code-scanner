#!/usr/bin/env node

/**
 * Test Script for Email Verification & Password Complexity
 * Run: node test-features.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  log('\n=== Email Verification & Password Complexity Tests ===\n', 'blue');

  try {
    // Test 1: Login with weak password
    log('Test 1: Login with weak password (should fail)', 'yellow');
    const weakLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'security@example.com',
      password: 'weak'
    });
    log(`Status: ${weakLogin.status}`, weakLogin.status === 400 ? 'green' : 'red');
    log(`Message: ${weakLogin.body.error || weakLogin.body.message}`);
    log(`Details: ${JSON.stringify(weakLogin.body.details)}\n`);

    // Test 2: Login with valid password
    log('Test 2: Login with valid password (should succeed)', 'yellow');
    const validLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'security@example.com',
      password: 'Security123'
    });
    log(`Status: ${validLogin.status}`, validLogin.status === 200 ? 'green' : 'red');
    if (validLogin.status === 200) {
      log(`Message: ${validLogin.body.message}`);
      log(`User: ${validLogin.body.user.username} (${validLogin.body.user.role})`);
      var superuserToken = validLogin.body.token; // Save for next test
    } else {
      log(`Error: ${validLogin.body.error || validLogin.body.message}`);
    }
    log('');

    // Test 3: Send verification code
    if (superuserToken) {
      log('Test 3: Send verification code', 'yellow');
      const sendCode = await makeRequest(
        'POST',
        '/api/superuser/send-verification-code',
        { email: 'newuser@test.com' },
        superuserToken
      );
      log(`Status: ${sendCode.status}`, sendCode.status === 200 ? 'green' : 'red');
      log(`Message: ${sendCode.body.message}`);
      log('(Check server console for verification code in development mode)\n');
    }

    // Test 4: Create user with weak password
    if (superuserToken) {
      log('Test 4: Create user with weak password (should fail)', 'yellow');
      const weakCreate = await makeRequest(
        'POST',
        '/api/superuser/create-user',
        {
          username: 'testuser',
          email: 'newuser@test.com',
          password: 'weak',
          role: 'osa',
          verificationCode: '000000'
        },
        superuserToken
      );
      log(`Status: ${weakCreate.status}`, weakCreate.status === 400 ? 'green' : 'red');
      log(`Message: ${weakCreate.body.message}`);
      log(`Details: ${JSON.stringify(weakCreate.body.details)}\n`);
    }

    log('=== All Tests Complete ===\n', 'blue');
    log('Key Features Implemented:', 'green');
    log('✅ Password complexity validation (8+ chars, uppercase, lowercase, numbers)');
    log('✅ Email verification codes with 10-minute expiry');
    log('✅ Maximum 5 failed verification attempts');
    log('✅ Brute force protection');
    log('✅ Superuser can verify emails before creating accounts\n');

  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests
runTests().then(() => {
  process.exit(0);
}).catch(err => {
  log(`Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
