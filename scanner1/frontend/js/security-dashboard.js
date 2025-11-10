const API_BASE = "http://localhost:3000/api";
const SOCKET_BASE = "http://localhost:3000";

let socket = null;

document.addEventListener("DOMContentLoaded", () => {
  showSection("monitoring");
  initializeSocket();
  loadRecentViolation();
  loadTodayViolations();
  loadProfile();
});

// SECTION SWITCHER
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

// SOCKET SETUP
function initializeSocket() {
  socket = io(SOCKET_BASE);
  socket.emit("join-room", "security");

  socket.on("new-violation", (data) => {
    updateRecentScanImage(data);
    showNotification("New violation captured!");
    loadTodayViolations();
  });
}

// MONITORING
function loadRecentViolation() {
  fetch(`${API_BASE}/dashboard/recent?limit=1`)
    .then((res) => res.json())
    .then((data) => {
      if (data[0]) updateRecentScanImage(data[0]);
    })
    .catch((err) => console.error("Error loading recent violation:", err));
}

function updateRecentScanImage(violation) {
  const img = document.getElementById("recentScanImage");
  img.src = violation.image || "https://via.placeholder.com/1200x800/E74C3C/FFFFFF?text=No+Recent+Violation";
}

// VIOLATIONS
function loadTodayViolations() {
  fetch(`${API_BASE}/reports/today`)
    .then((res) => res.json())
    .then((data) => displayViolations(data))
    .catch((err) => console.error("Error fetching today's violations:", err));
}

function displayViolations(violations) {
  const tbody = document.getElementById("violationsTableBody");
  tbody.innerHTML = "";

  if (!violations.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-gray-500">No violations for today.</td></tr>`;
    return;
  }

  violations.forEach((v) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="px-6 py-4">${v.student_info || "N/A"}</td>
      <td class="px-6 py-4">${v.violation || "N/A"}</td>
      <td class="px-6 py-4">${new Date(v.scanned_at).toLocaleDateString()}</td>
      <td class="px-6 py-4">
        <button onclick="editViolation('${v._id}', '${v.violation}')"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
          Edit
        </button>
      </td>`;
    tbody.appendChild(row);
  });
}

// EDIT VIOLATION TYPE
function editViolation(id, currentViolation) {
  const newViolation = prompt("Edit violation type:", currentViolation);
  if (!newViolation || newViolation.trim() === "") return;

  fetch(`${API_BASE}/violations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ violation: newViolation }),
  })
    .then((res) => {
      if (res.ok) {
        showNotification("Violation updated successfully!");
        loadTodayViolations();
      } else {
        showNotification("Failed to update violation.", "error");
      }
    })
    .catch((err) => console.error("Error updating violation:", err));
}

// PROFILE
function loadProfile() {
  const user = JSON.parse(localStorage.getItem("user")) || { name: "N/A" };
  document.getElementById("userName").textContent = user.name;
}

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index.html";
});

// NOTIFICATIONS
function showNotification(msg, type = "info") {
  const div = document.createElement("div");
  div.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg z-50 ${
    type === "error" ? "bg-red-500" : "bg-green-500"
  }`;
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}
