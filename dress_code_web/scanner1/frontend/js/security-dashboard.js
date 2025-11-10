// Security Dashboard functionality
let socket = null;
let recentViolations = [];

// Set backend URL (adjust if deployed to server later)
const API_BASE = "http://localhost:3000/api";
const SOCKET_BASE = "http://localhost:3000";

// Check authentication and role
function checkSecurityAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/';
        return;
    }
    
    const user = getCurrentUser();
    if (user.role !== 'security') {
        window.location.href = '/';
        return;
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkSecurityAuth();
    initializeSocket();
    showMonitoring();
    loadRecentViolations();
});

// Initialize Socket.IO
function initializeSocket() {
    socket = io(SOCKET_BASE); // explicitly connect to backend
    socket.emit('join-room', 'security');
    
    socket.on('violation-logged', (violation) => {
        showNotification('Violation logged successfully!', 'success');
        loadRecentViolations();
    });
    
    socket.on('new-violation', (violation) => {
        recentViolations.unshift(violation);
        updateRecentScanImage(violation);
        if (document.getElementById('alertsSection').style.display !== 'none') {
            loadAlerts();
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
        type === 'warning' ? 'bg-yellow-500 text-white' : 
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Show monitoring section
function showMonitoring() {
    document.getElementById('monitoringSection').classList.remove('hidden');
    document.getElementById('logsSection').classList.add('hidden');
    document.getElementById('alertsSection').classList.add('hidden');
    document.getElementById('pageTitle').textContent = 'Real-time Monitoring';
    
    // Update active link
    updateActiveLink('monitoringLink');
}

// Show logs section
function showLogs() {
    document.getElementById('monitoringSection').classList.add('hidden');
    document.getElementById('logsSection').classList.remove('hidden');
    document.getElementById('alertsSection').classList.add('hidden');
    document.getElementById('pageTitle').textContent = 'Student Violation Logs';
    
    // Update active link
    updateActiveLink('logsLink');
    
    loadViolationLogs();
}

// Show alerts section
function showAlerts() {
    document.getElementById('monitoringSection').classList.add('hidden');
    document.getElementById('logsSection').classList.add('hidden');
    document.getElementById('alertsSection').classList.remove('hidden');
    document.getElementById('pageTitle').textContent = 'Alert & Notifications';
    
    // Update active link
    updateActiveLink('alertsLink');
    
    loadAlerts();
}

// Update active navigation link
function updateActiveLink(activeId) {
    const links = ['monitoringLink', 'logsLink', 'alertsLink'];
    links.forEach(linkId => {
        const link = document.getElementById(linkId);
        if (linkId === activeId) {
            link.classList.add('bg-blue-600');
        } else {
            link.classList.remove('bg-blue-600');
        }
    });
}

// Load recent violations
async function loadRecentViolations() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/recent?limit=5`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            recentViolations = await response.json();
            if (recentViolations.length > 0) {
                updateRecentScanImage(recentViolations[0]);
            }
        }
    } catch (error) {
        console.error('Error loading recent violations:', error);
    }
}

// Update recent scan image
function updateRecentScanImage(violation) {
    const img = document.getElementById('recentScanImage');
    if (violation && violation.image) {
        img.src = violation.image;
        img.alt = `Recent violation: ${violation.violation}`;
    }
}

// Load violation logs
async function loadViolationLogs() {
    try {
        const response = await fetch(`${API_BASE}/violations`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const violations = await response.json();
            displayViolationLogs(violations);
        }
    } catch (error) {
        console.error('Error loading violation logs:', error);
    }
}

// Display violation logs in table
function displayViolationLogs(violations) {
    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = '';
    
    violations.forEach(violation => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        const statusClass = getStatusClass(violation.status);
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${violation.studentName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${violation.violation}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${violation.date}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                    ${violation.status}
                </span>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Get status class for styling
function getStatusClass(status) {
    switch (status) {
        case 'resolved':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'not yet resolved':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Search logs
async function searchLogs() {
    const studentName = document.getElementById('logSearchInput').value;
    const violation = document.getElementById('logViolationInput').value;
    const date = document.getElementById('logDateInput').value;

    const params = new URLSearchParams();

    // Combine search terms into a single search parameter
    const searchTerms = [];
    if (studentName) searchTerms.push(studentName);
    if (violation) searchTerms.push(violation);

    if (searchTerms.length > 0) {
        params.append('search', searchTerms.join(' '));
    }

    if (date) {
        params.append('startDate', date);
        params.append('endDate', date);
    }

    try {
        const response = await fetch(`${API_BASE}/violations?${params.toString()}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const violations = await response.json();
            displayViolationLogs(violations);
        }
    } catch (error) {
        console.error('Error searching logs:', error);
    }
}

// Load alerts
async function loadAlerts() {
    try {
        const response = await fetch(`${API_BASE}/violations?status=pending`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const violations = await response.json();
            displayAlerts(violations.slice(0, 6)); // Show latest 6 alerts
        }
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

// Display alerts
function displayAlerts(violations) {
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';
    
    violations.forEach(violation => {
        const alertCard = document.createElement('div');
        alertCard.className = 'bg-white rounded-lg shadow p-6';
        
        alertCard.innerHTML = `
            <div class="text-center mb-4">
                <h5 class="text-lg font-medium text-gray-900">Violator Picture</h5>
            </div>
            <div class="bg-gray-200 rounded-lg h-48 flex items-center justify-center mb-4">
                <img src="${violation.image || 'https://via.placeholder.com/300x200/E74C3C/FFFFFF?text=Violation+Image'}" 
                     alt="Violation" class="rounded-lg max-w-full h-auto">
            </div>
            <div class="space-y-2">
                <p class="text-sm"><strong>Violation type:</strong> ${violation.violation}</p>
                <p class="text-sm"><strong>Time:</strong> ${violation.time || 'N/A'}</p>
                <p class="text-sm"><strong>Date:</strong> ${violation.date}</p>
            </div>
        `;
        
        container.appendChild(alertCard);
    });
}

// Open add violation modal
function openAddViolationModal() {
    document.getElementById('addViolationModal').classList.remove('hidden');
}

// Close add violation modal
function closeAddViolationModal() {
    document.getElementById('addViolationModal').classList.add('hidden');
    document.getElementById('addViolationForm').reset();
}

// Handle add violation form submission
document.getElementById('addViolationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('studentName', document.getElementById('studentNameInput').value);
    formData.append('yearLevel', document.getElementById('yearLevelInput').value);
    formData.append('course', document.getElementById('courseInput').value);
    formData.append('violation', document.getElementById('violationTypeInput').value);
    formData.append('date', new Date().toISOString().split('T')[0]);
    formData.append('time', new Date().toLocaleTimeString());
    
    const imageFile = document.getElementById('violationImageInput').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        const response = await fetch(`${API_BASE}/violations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            showNotification('Violation added successfully!', 'success');
            closeAddViolationModal();
            loadRecentViolations();
            loadViolationLogs(); // Always reload logs after adding a violation
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to add violation', 'error');
        }
    } catch (error) {
        console.error('Error adding violation:', error);
        showNotification('Error adding violation', 'error');
    }
});
