const API_BASE = "http://localhost:3000/api";
const SOCKET_BASE = "http://localhost:3000";

let socket = null;

// Token from localStorage
const token = localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", () => {
  showSection("monitoring");
  initializeSocket();
  loadLatestImage();
  loadProfile();
});

// ================= SECTION SWITCHER =================
function showSection(section) {
  document.getElementById("monitoringSection").classList.add("hidden");
  document.getElementById("violationsSection").classList.add("hidden");
  document.getElementById("profileSection").classList.add("hidden");

  if (section === "monitoring") {
    document.getElementById("monitoringSection").classList.remove("hidden");
    document.getElementById("pageTitle").textContent = "Violation Monitoring";
  } else if (section === "violations") {
    document.getElementById("violationsSection").classList.remove("hidden");
    document.getElementById("pageTitle").textContent = "Today's Violations";
    loadTodayViolations();
  } else if (section === "profile") {
    document.getElementById("profileSection").classList.remove("hidden");
    document.getElementById("pageTitle").textContent = "Profile";
  }
}

// ================= SOCKET.IO =================
function initializeSocket() {
  socket = io(SOCKET_BASE);
  socket.emit("join-room", "security");

  socket.on("new-violation", (data) => {
    if (data.imageUrl) {
      updateRecentScanImage(data.imageUrl);
      showNotification("New violation captured!");
      loadTodayViolations(); // refresh table when a new violation is captured
    }
  });
}

// ================= LOAD LATEST IMAGE =================
async function loadLatestImage() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/latest-image`);
    const data = await res.json();
    const img = document.getElementById("recentScanImage");

    if (data.imageUrl) {
      img.src = data.imageUrl;
      img.style.display = "block";
      img.onerror = () => {
        console.error("Failed to load image:", data.imageUrl);
        img.style.display = "none";
      };
    } else {
      img.style.display = "none";
    }
  } catch (err) {
    console.error("Error loading latest image:", err);
    document.getElementById("recentScanImage").style.display = "none";
  }

  setTimeout(loadLatestImage, 10000); // reload every 10 sec
}

// ================= UPDATE IMAGE =================
function updateRecentScanImage(imageUrl) {
  const img = document.getElementById("recentScanImage");
  if (!imageUrl) return;
  img.src = imageUrl;
}

// ================= PROFILE =================
function loadProfile() {
  const user = JSON.parse(localStorage.getItem("user")) || { email: "N/A" };
  document.getElementById("userName").textContent = user.email;
}

// ================= LOAD TODAY'S VIOLATIONS =================
async function loadTodayViolations() {
  try {
    if (!token) return;

    const today = new Date();
    const todayLocal = today.toLocaleDateString("en-CA"); // YYYY-MM-DD

    // Fetch today's reports from server (server-side date handling)
    const res = await fetch(`${API_BASE}/reports/today`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to fetch today\'s reports');

    const reports = await res.json();

    // Normalize reports: extract studentName, course, yearLevel
    const todayViolations = (reports || []).map(r => {
      let studentName = 'Unknown';
      let course = 'N/A';
      let yearLevel = 'N/A';

      if (r.student_info) {
        if (typeof r.student_info === 'object') {
          studentName = r.student_info.name || studentName;
          course = r.student_info.course || course;
          yearLevel = r.student_info.yearLevel || yearLevel;
        } else if (typeof r.student_info === 'string') {
          studentName = r.student_info;
        }
      }

      return Object.assign({}, r, { studentName, course, yearLevel });
    });

    const tbody = document.getElementById("violationsTableBody");
    tbody.innerHTML = "";

    if (todayViolations.length === 0) {
      tbody.innerHTML =
        `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">
          No violations recorded today
        </td></tr>`;
      return;
    }

    todayViolations.forEach(v => {
      // Convert to Philippines time (UTC+8)
      const phTime = new Date(new Date(v.scanned_at).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
      const date = phTime.toLocaleDateString("en-CA");
      const time = phTime.toLocaleTimeString("en-US", { hour12: true });

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="px-6 py-4">
          <p class="font-semibold">${v.studentName || "Unknown"}</p>
        </td>
        <td class="px-6 py-4">
          <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            ${v.violation || "Unknown"}
          </span>
        </td>
        <td class="px-6 py-4">${v.submitted_by || "-"}</td>
        <td class="px-6 py-4">
          <div>
            <p class="font-medium">${date}</p>
            <p class="text-sm text-gray-500">${time}</p>
          </div>
        </td>
        <td class="px-6 py-4">
          <button onclick="editViolation('${v._id}', decodeURIComponent('${encodeURIComponent(v.violation || '')}'))" class="bg-[#1A1851] hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
            Edit
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

  } catch (err) {
    console.error("Error loading today's violations:", err);
    document.getElementById("violationsTableBody").innerHTML =
      `<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">
        Error loading violations
      </td></tr>`;
  }
}

// ================= EDIT VIOLATION =================
// Edit modal state
let currentEditReportId = null;

async function editViolation(id, currentViolation) {
  try {
    currentEditReportId = id;

    const input = document.getElementById('editViolationInput');
    if (typeof currentViolation !== 'undefined' && currentViolation !== null) {
      // use provided value (passed from the rendered table) to avoid extra fetch
      input.value = currentViolation;
    } else {
      // fallback: fetch report details
      const res = await fetch(`${API_BASE}/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch report');
      const report = await res.json();
      input.value = report.violation || '';
    }

    document.getElementById('editViolationModal').classList.remove('hidden');
  } catch (err) {
    console.error('Error opening edit modal:', err);
    showNotification('Failed to open edit dialog', 'error');
  }
}

function closeEditModal() {
  document.getElementById('editViolationModal').classList.add('hidden');
  currentEditReportId = null;
}

async function saveEditedViolation() {
  if (!currentEditReportId) return;
  const input = document.getElementById('editViolationInput');
  const newViolation = input.value.trim();
  if (!newViolation) {
    showNotification('Violation cannot be empty', 'error');
    return;
  }

  try {
    const url = `${API_BASE}/reports/${encodeURIComponent(currentEditReportId)}`;
    console.log('Saving edited violation to', url, 'body:', { violation: newViolation });
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ violation: newViolation })
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }
    if (!res.ok) {
      console.error('Save failed response:', res.status, data);
      throw new Error('Failed to save changes: ' + (data && data.message ? data.message : res.status));
    }
    showNotification('Violation updated');
    closeEditModal();
    loadTodayViolations();
    // Optionally notify other dashboards via socket
    if (socket) socket.emit('violation-updated', { id: currentEditReportId });
  } catch (err) {
    console.error('Error saving edited violation:', err);
    showNotification('Failed to save changes', 'error');
  }
}

// ================= LOGOUT =================
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index.html";
});

// ================= NOTIFICATION =================
function showNotification(msg, type = "info") {
  const div = document.createElement("div");
  div.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg z-50 ${
    type === "error" ? "bg-red-500" : "bg-green-500"
  }`;
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}
