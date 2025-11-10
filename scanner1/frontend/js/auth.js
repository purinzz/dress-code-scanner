// Authentication utilities
const API_BASE = 'http://localhost:3000/api';


// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.role) {
        // Redirect to appropriate dashboard
        if (user.role === 'osa') {
            window.location.href = '/osa/dashboard.html';
        } else if (user.role === 'security') {
            window.location.href = '/security/dashboard.html';
        }
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.remove('hidden');
        setTimeout(() => {
            successDiv.classList.add('hidden');
        }, 5000);
    }
}

// Login form handler
if (document.getElementById('loginForm')) {
    checkAuth(); // Check if already logged in
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const loginBtn = document.getElementById('loginBtn');
        const loginBtnText = document.getElementById('loginBtnText');
        const loginSpinner = document.getElementById('loginSpinner');
        
        // Show loading state
        loginBtn.disabled = true;
        loginBtnText.textContent = 'Logging in...';
        loginSpinner.classList.remove('hidden');
        
        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };


        
        try {
            console.log("Attempting login...", email);

            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect based on role
                if (data.user.role === 'osa') {
    window.location.href = '/osa/dashboard.html';
} else if (data.user.role === 'security') {
    window.location.href = '/security/dashboard.html';
} else if (data.user.role === 'superuser') {  // ✅ fixed here
    window.location.href = '/superuser/dashboard.html';
} else {
    console.error("Unknown role:", data.user.role);
}

            } else {
                showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please try again.');
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            loginBtnText.textContent = 'Login';
            loginSpinner.classList.add('hidden');
        }
    });
}

// Signup form handler
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const signupBtn = document.getElementById('signupBtn');
        const signupBtnText = document.getElementById('signupBtnText');
        const signupSpinner = document.getElementById('signupSpinner');
        
        // Show loading state
        signupBtn.disabled = true;
        signupBtnText.textContent = 'Creating account...';
        signupSpinner.classList.remove('hidden');
        
        const formData = new FormData(e.target);
        const signupData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role')
        };
        
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showSuccess('Account created successfully! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                showError(data.error || 'Signup failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showError('Network error. Please try again.');
        } finally {
            // Reset button state
            signupBtn.disabled = false;
            signupBtnText.textContent = 'Sign Up';
            signupSpinner.classList.add('hidden');
        }
    });
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || '{}');
}
