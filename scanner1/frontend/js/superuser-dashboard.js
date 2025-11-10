const API_BASE = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

// Redirect if not logged in
if (!token) {
  window.location.href = '/index.html';
}

// Fetch and display users
async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/superuser/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const users = await res.json();

    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
      if (user.role === 'superuser') return; // don't show self

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-6 py-4">${user.username}</td>
        <td class="px-6 py-4">${user.email}</td>
        <td class="px-6 py-4">${user.role}</td>
        <td class="px-6 py-4 text-center space-x-3">
          <button onclick="editRole('${user._id}', '${user.role}')"
            class="text-blue-600 hover:text-blue-800"><i class="fas fa-edit"></i></button>
          <button onclick="deleteUser('${user._id}')"
            class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

// Edit role
async function editRole(id, currentRole) {
  const newRole = prompt(`Change role (osa/security):`, currentRole);
  if (!newRole) return;

  const res = await fetch(`${API_BASE}/superuser/users/${id}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ role: newRole })
  });

  if (res.ok) {
    alert('Role updated!');
    loadUsers();
  } else {
    alert('Failed to update role.');
  }
}

// Delete user
async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  const res = await fetch(`${API_BASE}/superuser/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.ok) {
    alert('User deleted!');
    loadUsers();
  } else {
    alert('Failed to delete user.');
  }
}

// Create new user
document.getElementById('createUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('newUsername').value;
  const email = document.getElementById('newEmail').value;
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;

  const res = await fetch(`${API_BASE}/superuser/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ username, email, password, role })
  });

  const data = await res.json();

  if (res.ok) {
    alert('User created successfully!');
    document.getElementById('createUserForm').reset();
    showSection('users');
    loadUsers();
  } else {
    alert(data.error || 'Failed to create user.');
  }
});

// Load profile info
function loadProfile() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    document.getElementById('superuserName').innerText = user.username;
    document.getElementById('superuserEmail').innerText = user.email;
  }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
});

window.onload = () => {
  loadUsers();
  loadProfile();
};
