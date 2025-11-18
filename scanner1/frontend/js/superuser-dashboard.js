const API_BASE = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) window.location.href = '/index.html';

let editUserId = null;
let deleteUserId = null;

// ====== Toast ======
function showToast(msg, success = true) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `fixed bottom-5 right-5 px-6 py-3 rounded-md text-white shadow-lg ${success ? 'bg-green-500' : 'bg-red-500'}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ====== Load Users ======
async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/superuser/users`, { headers: { Authorization: `Bearer ${token}` } });
    const users = await res.json();
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    users.forEach(user => {
      if (user.role === 'superuser') return;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-6 py-4">${user.username}</td>
        <td class="px-6 py-4">${user.email}</td>
        <td class="px-6 py-4">${user.role}</td>
        <td class="px-6 py-4 text-center space-x-3">
          <button onclick="openRoleModal('${user._id}', '${user.role}')" class="text-blue-600 hover:text-blue-800"><i class="fas fa-edit"></i></button>
          <button onclick="openDeleteModal('${user._id}')" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) { console.error(err); }
}

// ====== Edit Role ======
function openRoleModal(id, role) {
  editUserId = id;
  document.getElementById('roleSelect').value = role;
  document.getElementById('roleModal').classList.remove('hidden');
}

function closeRoleModal() {
  editUserId = null;
  document.getElementById('roleModal').classList.add('hidden');
}

async function updateUserRole() {
  if (!editUserId) return;
  const newRole = document.getElementById('roleSelect').value;
  try {
    const res = await fetch(`${API_BASE}/superuser/users/${editUserId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole })
    });
    if (res.ok) showToast('Role updated successfully!');
    else showToast('Failed to update role.', false);
    loadUsers();
  } catch (err) { showToast('Server error.', false); console.error(err); }
  closeRoleModal();
}

// ====== Delete User ======
function openDeleteModal(id) {
  deleteUserId = id;
  document.getElementById('deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
  deleteUserId = null;
  document.getElementById('deleteModal').classList.add('hidden');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!deleteUserId) return;
  try {
    const res = await fetch(`${API_BASE}/superuser/users/${deleteUserId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) showToast('User deleted successfully!');
    else showToast('Failed to delete user.', false);
    loadUsers();
  } catch (err) { showToast('Server error.', false); console.error(err); }
  closeDeleteModal();
});

// ====== Create User ======
let emailForVerification = "";

// Step 1: Send verification code
document.getElementById('sendCodeBtn').addEventListener('click', async () => {
  const email = document.getElementById('verifyEmail').value;
  
  if (!email) {
    showToast('Please enter an email address', false);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/superuser/send-verification-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    
    if (res.ok) {
      emailForVerification = email;
      showToast('Verification code sent! Check your email or console.');
      // Show step 2
      document.getElementById('step1').classList.add('hidden');
      document.getElementById('createUserForm').classList.remove('hidden');
    } else {
      showToast(data.message || 'Failed to send code', false);
    }
  } catch (err) { 
    showToast('Server error', false); 
    console.error(err); 
  }
});

// Back button
document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('createUserForm').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
  document.getElementById('verifyEmail').value = '';
  document.getElementById('createUserForm').reset();
  emailForVerification = '';
});

// Step 2: Create user with verification code
document.getElementById('createUserForm').addEventListener('submit', async e => {
  e.preventDefault();
  
  const username = document.getElementById('newUsername').value;
  const verificationCode = document.getElementById('verificationCode').value;
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;

  if (!emailForVerification) {
    showToast('Please go back and verify email first', false);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/superuser/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ 
        username, 
        email: emailForVerification, 
        password, 
        role,
        verificationCode
      })
    });
    const data = await res.json();
    
    if (res.ok) {
      showToast('User created successfully!');
      document.getElementById('createUserForm').reset();
      document.getElementById('step1').classList.remove('hidden');
      document.getElementById('createUserForm').classList.add('hidden');
      document.getElementById('verifyEmail').value = '';
      emailForVerification = '';
      showSection('users');
      loadUsers();
    } else {
      showToast(data.message || data.details?.[0] || 'Failed to create user.', false);
    }
  } catch (err) { 
    showToast('Server error.', false); 
    console.error(err); 
  }
});

// ====== Profile ======
function loadProfile() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    document.getElementById('superuserEmail').innerText = user.email || 'N/A';
  }
}

// ====== Logout ======
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
});

// ====== Load initial data ======
window.onload = () => {
  loadUsers();
  loadProfile();
};

// ====== Navigation ======
function showSection(section) {
  const sections = ["usersSection", "createUserSection", "profileSection"];
  sections.forEach(id => document.getElementById(id).classList.add("hidden"));
  document.getElementById(section + "Section").classList.remove("hidden");
  document.getElementById("pageTitle").innerText =
    section === "users" ? "Users" :
    section === "createUser" ? "Create User" : "Profile";
}
