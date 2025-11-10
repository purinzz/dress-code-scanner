// osa-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  fetchViolations();
  setupLogout();
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
    const reports = await res.json()
    console.log('Fetched reports:', reports);

    const tableBody = document.getElementById('violationsTableBody');
    tableBody.innerHTML = '';

    if (!reports || reports.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="6" class="text-center py-6 text-gray-500 text-lg">No reports found.</td></tr>
      `;
      return;
    }

    // Group reports by student name to count offenses
    const studentOffenseCount = {};
    reports.forEach((r) => {
      const studentName =
        typeof r.student_info === 'object'
          ? r.student_info.name || 'Unknown'
          : r.student_info || 'Unknown';

      if (!studentOffenseCount[studentName]) {
        studentOffenseCount[studentName] = 1;
      } else {
        studentOffenseCount[studentName]++;
      }

      r.studentName = studentName;
      r.offense_no = studentOffenseCount[studentName]; // assign offense count
    });

    // Now render the table
    reports.forEach((report) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-6 py-4">${report.studentName}</td>
        <td class="px-6 py-4">${report.violation || 'N/A'}</td>
        <td class="px-6 py-4">${report.offense_no}</td>
        <td class="px-6 py-4">${new Date(report.scanned_at).toLocaleString()}</td>
        <td class="px-6 py-4 capitalize">${report.status || 'pending'}</td>
        <td class="px-6 py-4 flex space-x-2">
          <button
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            onclick="openStatusModal('${report._id}')"
          >
            Update
          </button>
          <button
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            onclick="softDeleteReport('${report._id}', this)"
          >
            Hide
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error fetching violations:', error);
  }
}


// ====== SOFT DELETE FUNCTION ======
async function softDeleteReport(reportId, btn) {
  const confirmDelete = confirm('Hide this violation from your dashboard?');
  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/reports/soft-delete/${reportId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.ok) {
      alert('Report hidden successfully!');
      fetchViolations(); // Refresh table
    } else {
      alert('Failed to hide report.');
    }
  } catch (error) {
    console.error('Error hiding report:', error);
    alert('Server connection error.');
  }
}

// ====== SEARCH FUNCTION ======
function searchViolations() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#violationsTableBody tr');

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
}

// ====== STATUS MODAL LOGIC ======
let currentReportId = null;

function openStatusModal(reportId) {
  currentReportId = reportId;
  document.getElementById('statusModal').classList.remove('hidden');
}

function closeStatusModal() {
  document.getElementById('statusModal').classList.add('hidden');
  currentReportId = null;
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

    if (res.ok) {
      alert('Status updated successfully!');
      closeStatusModal();
      fetchViolations(); // Refresh the table
    } else {
      alert('Failed to update status');
    }
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

// ====== LOGOUT HANDLER ======
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
  });
}
