document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    // If not logged in, go back to login
    window.location.href = '/';
    return;
  }

  // Display user info
  document.getElementById('userName').textContent = user.name || 'Unknown';
  document.getElementById('userRole').textContent = user.role || 'N/A';

  // Logout logic
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  });
});

  function goBack() {
    // Detect role and redirect accordingly
    const role = localStorage.getItem('role');

    if (role === 'osa') {
      window.location.href = '/osa/dashboard.html';
    } else if (role === 'security') {
      window.location.href = '/security/dashboard.html';
    } else {
      window.location.href = '/'; // default or login page
    }
  }