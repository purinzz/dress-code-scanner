// osa-dashboard.js

let socket = null;
let currentSort = { field: null, ascending: true };
let allReports = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  fetchViolations();
  loadProfile();
  setupLogout();

  // Initialize socket and listen for updates
  if (typeof io !== 'undefined') {
    socket = io('http://localhost:3000');
    socket.emit('join-room', 'osa');
    socket.on('violation-updated', (data) => {
      // refresh list when a report is updated elsewhere
      fetchViolations();
      showToast('Report updated', true);
    });
  }
});

// ====== FETCH OVERVIEW STATS ======
async function fetchStats() {
  try {
    const res = await fetch('/api/reports/stats');
    const data = await res.json();
    document.getElementById('totalViolations').textContent = data.total || 0;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

// ====== FETCH ALL VIOLATIONS ======
async function fetchViolations() {
  try {
    const res = await fetch('/api/reports');
    allReports = await res.json();
    
    if (!allReports || allReports.length === 0) {
      const tableBody = document.getElementById('violationsTableBody');
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-500 text-lg">No reports found.</td></tr>`;
      return;
    }

    // Sort reports by date (oldest first) to maintain consistent offense numbering
    allReports.sort((a, b) => new Date(a.scanned_at) - new Date(b.scanned_at));

    const studentOffenseCount = {};
    allReports.forEach(r => {
      const studentName = typeof r.student_info === 'object' ? r.student_info.name || 'Unknown' : r.student_info || 'Unknown';
      if (!studentOffenseCount[studentName]) studentOffenseCount[studentName] = 1;
      else studentOffenseCount[studentName]++;
      r.studentName = studentName;
      r.offense_no = studentOffenseCount[studentName];
    });

    // Render with current sort if any
    renderViolationsTable(allReports);
  } catch (error) {
    console.error('Error fetching violations:', error);
  }
}

// ====== RENDER VIOLATIONS TABLE ======
function renderViolationsTable(reports) {
  const tableBody = document.getElementById('violationsTableBody');
  tableBody.innerHTML = '';

  reports.forEach(report => {
    const row = document.createElement('tr');
    // Convert to Philippines time (UTC+8)
    const phTime = new Date(new Date(report.scanned_at).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const dateTimeString = phTime.toLocaleString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
    
    row.innerHTML = `
      <td class="px-6 py-4">${report.studentName}</td>
      <td class="px-6 py-4">${report.violation || 'N/A'}</td>
      <td class="px-6 py-4">${report.offense_no}</td>
      <td class="px-6 py-4">${report.submitted_by || 'N/A'}</td>
      <td class="px-6 py-4">${dateTimeString}</td>
      <td class="px-6 py-4 capitalize">${report.status || 'pending'}</td>
      <td class="px-6 py-4 flex space-x-2">
        <button class="bg-[#1A1851] hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          onclick="viewImage('${report.image_path}')">View Image</button>
        <button class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
          onclick="openStatusModal('${report._id}')">Update Status</button>
        <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          onclick="openDeleteModal('${report._id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// ====== SORT TABLE ======
function sortTable(field) {
  // If clicking the same field, toggle direction
  if (currentSort.field === field) {
    currentSort.ascending = !currentSort.ascending;
  } else {
    // New field, sort ascending
    currentSort.field = field;
    currentSort.ascending = true;
  }

  let sortedReports = [...allReports];

  switch(field) {
    case 'student':
      sortedReports.sort((a, b) => {
        const nameA = a.studentName.toLowerCase();
        const nameB = b.studentName.toLowerCase();
        return currentSort.ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
      break;
    case 'violation':
      sortedReports.sort((a, b) => {
        const violationA = (a.violation || 'N/A').toLowerCase();
        const violationB = (b.violation || 'N/A').toLowerCase();
        return currentSort.ascending ? violationA.localeCompare(violationB) : violationB.localeCompare(violationA);
      });
      break;
    case 'offense':
      sortedReports.sort((a, b) => {
        return currentSort.ascending ? a.offense_no - b.offense_no : b.offense_no - a.offense_no;
      });
      break;
    case 'submitted_by':
      sortedReports.sort((a, b) => {
        const submittedA = (a.submitted_by || 'N/A').toLowerCase();
        const submittedB = (b.submitted_by || 'N/A').toLowerCase();
        return currentSort.ascending ? submittedA.localeCompare(submittedB) : submittedB.localeCompare(submittedA);
      });
      break;
    case 'date':
      sortedReports.sort((a, b) => {
        const dateA = new Date(a.scanned_at);
        const dateB = new Date(b.scanned_at);
        return currentSort.ascending ? dateA - dateB : dateB - dateA;
      });
      break;
    case 'status':
      sortedReports.sort((a, b) => {
        const statusA = (a.status || 'pending').toLowerCase();
        const statusB = (b.status || 'pending').toLowerCase();
        return currentSort.ascending ? statusA.localeCompare(statusB) : statusB.localeCompare(statusA);
      });
      break;
  }

  renderViolationsTable(sortedReports);
  updateSortIndicators(field);
}

// ====== UPDATE SORT INDICATORS ======
function updateSortIndicators(field) {
  // Remove all existing indicators
  document.querySelectorAll('th').forEach(th => {
    th.textContent = th.textContent.replace(' ▲', '').replace(' ▼', '');
  });

  // Add indicator to current sorted column
  const headers = {
    'student': 0,
    'violation': 1,
    'offense': 2,
    'submitted_by': 3,
    'date': 4,
    'status': 5
  };

  if (headers[field] !== undefined) {
    const headerCells = document.querySelectorAll('thead th');
    const indicator = currentSort.ascending ? ' ▲' : ' ▼';
    headerCells[headers[field]].textContent += indicator;
  }
}

// ====== VIEW IMAGE BUTTON (FIXED) ======
function viewImage(imagePath) {
  // Handle actual null, undefined, empty string, or the literal strings "null" / "undefined"
  if (
    !imagePath ||
    imagePath.trim() === "" ||
    imagePath === "null" ||
    imagePath === "undefined"
  ) {
    showToast("No image attached to this report", false);
    return;
  }

  window.open(imagePath, '_blank');
}

// ====== TOAST ======
function showToast(message, success = true) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `fixed bottom-5 right-5 px-6 py-3 rounded-md text-white shadow-lg ${success ? 'bg-green-500' : 'bg-red-500'}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ====== DELETE MODAL ======
let reportToDelete = null;
function openDeleteModal(reportId) {
  reportToDelete = reportId;
  document.getElementById('deleteModal').classList.remove('hidden');
}
function closeDeleteModal() {
  reportToDelete = null;
  document.getElementById('deleteModal').classList.add('hidden');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!reportToDelete) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/reports/soft-delete/${reportToDelete}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.ok) showToast('Report deleted successfully!');
    else showToast('Failed to delete report.', false);
    fetchViolations();
  } catch (error) {
    console.error('Error deleting report:', error);
    showToast('Server error.', false);
  } finally {
    closeDeleteModal();
  }
});

// ====== STATUS MODAL ======
let currentReportId = null;
function openStatusModal(reportId) {
  currentReportId = reportId;
  document.getElementById('statusModal').classList.remove('hidden');
}
function closeStatusModal() {
  currentReportId = null;
  document.getElementById('statusModal').classList.add('hidden');
}
async function updateViolationStatus() {
  if (!currentReportId) return;
  const status = document.getElementById('statusSelect').value;
  try {
    const res = await fetch(`/api/reports/${currentReportId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) showToast('Status updated successfully!');
    else showToast('Failed to update status.', false);
    fetchViolations();
    closeStatusModal();
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('Server error.', false);
  }
}

// ====== SEARCH ======
function searchViolations() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#violationsTableBody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
}

// ====== PROFILE ======
function loadProfile() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    document.getElementById('superuserEmail').innerText = user.email || 'N/A';
  }
}

// ====== LOGOUT ======
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
  });
}

// ====== NAVIGATION ======
function showSection(section) {
  document.getElementById('overviewSection').classList.add('hidden');
  document.getElementById('violationsSection').classList.add('hidden');
  document.getElementById('profileSection').classList.add('hidden');

  if (section === 'overview') document.getElementById('overviewSection').classList.remove('hidden');
  else if (section === 'violations') document.getElementById('violationsSection').classList.remove('hidden');
  else if (section === 'profile') document.getElementById('profileSection').classList.remove('hidden');
}
