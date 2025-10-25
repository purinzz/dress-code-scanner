// ===============================
// OSA Dashboard Script
// ===============================

let socket = null;

// Check authentication and role
function checkOSAAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  const user = getCurrentUser();
  if (user.role !== 'osa') {
    window.location.href = '/';
    return;
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  checkOSAAuth();
  initializeSocket();
  showOverview();
});

// -------------------------------
// SOCKET.IO
// -------------------------------
function initializeSocket() {
  socket = io();
  socket.emit('join-room', 'osa');

  socket.on('new-violation', () => {
    showNotification('New violation detected!', 'warning');
    loadDashboardStats();
    if (!document.getElementById('violationsSection').classList.contains('hidden')) {
      loadViolations();
    }
  });
}

// -------------------------------
// NOTIFICATIONS
// -------------------------------
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
    type === 'warning'
      ? 'bg-yellow-500 text-white'
      : type === 'success'
      ? 'bg-green-500 text-white'
      : 'bg-blue-500 text-white'
  }`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// -------------------------------
// NAVIGATION
// -------------------------------
function showOverview() {
  document.getElementById('overviewSection').classList.remove('hidden');
  document.getElementById('violationsSection').classList.add('hidden');
  document.getElementById('pageTitle').textContent = 'Dashboard';

  document.getElementById('overviewLink').classList.add('bg-[#1a1851]');
  document.getElementById('violationsLink').classList.remove('bg-[#1a1851]');

  loadDashboardStats();
}

function showViolations() {
  document.getElementById('overviewSection').classList.add('hidden');
  document.getElementById('violationsSection').classList.remove('hidden');
  document.getElementById('pageTitle').textContent = 'Violations';

  document.getElementById('overviewLink').classList.remove('bg-[#1a1851]');
  document.getElementById('violationsLink').classList.add('bg-[#1a1851]');

  loadViolations();
}

// -------------------------------
// DASHBOARD STATS
// -------------------------------
async function loadDashboardStats() {
  try {
    const response = await fetch('/api/reports/stats');
    if (response.ok) {
      const stats = await response.json();
      document.getElementById('totalViolations').textContent = stats.total;
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// -------------------------------
// VIOLATIONS LIST
// -------------------------------
async function loadViolations() {
  try {
    const response = await fetch('/api/reports');
    if (response.ok) {
      const reports = await response.json();
      displayViolations(reports);
    }
  } catch (error) {
    console.error('Error loading violations:', error);
  }
}

function displayViolations(reports) {
  const tbody = document.getElementById('violationsTableBody');
  tbody.innerHTML = '';

  reports.forEach((report) => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ${typeof report.student_info === 'object'
          ? `${report.student_info.name || 'Unknown'}`
          : report.student_info}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.violation || '—'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
       ${report.no_of_offense || 1}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${new Date(report.scanned_at).toLocaleString()}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
       <select onchange="updateStatus('${report._id}', this.value)" class="border rounded px-2 py-1">
        <option value="pending" ${report.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>Resolved</option>
       </select>
     </td>
    `;


    tbody.appendChild(row);
  });
}

// -------------------------------
// STATUS UPDATE
// -------------------------------
async function updateStatus(reportId, newStatus) {
  try {
    const response = await fetch(`/api/reports/${reportId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      showNotification('Status updated successfully', 'success');
      loadDashboardStats();
    } else {
      showNotification('Failed to update status', 'warning');
    }
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

// -------------------------------
// SEARCH
// -------------------------------
async function searchViolations() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  try {
    const response = await fetch('/api/reports');
    if (response.ok) {
      let reports = await response.json();

      if (searchTerm) {
        reports = reports.filter(
          (r) =>
            r.student_info.toLowerCase().includes(searchTerm) ||
            r.violation.toLowerCase().includes(searchTerm)
        );
      }

      displayViolations(reports);
    }
  } catch (error) {
    console.error('Error searching reports:', error);
  }
}
