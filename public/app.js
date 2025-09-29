// Client-side JavaScript for Sande Family website

// Store token after login/signup
async function handleAuth(formId, endpoint) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Validate confirm password for signup
    if (endpoint === 'signup' && data.password !== data['confirm-password']) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem('token', result.token);
        alert(`${endpoint === 'login' ? 'Login' : 'Signup'} successful! Redirecting to family website...`);
        window.location.href = '/'; // Redirect to family website
      } else {
        alert(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error(`Error during ${endpoint}:`, error);
      alert('An error occurred. Please try again.');
    }
  });
}

// Initialize auth forms
handleAuth('signin-form', 'login');
handleAuth('signup-form', 'signup');

// Check authentication status on page load
async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/auth';
    return;
  }
  try {
    const response = await fetch('/api/auth/check', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!data.success) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    window.location.href = '/auth';
  }
}

// Run auth check on protected pages
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
  checkAuth();
}

// Handle logout
document.querySelectorAll('a[href="/api/logout"]').forEach(link => {
  link.addEventListener('click', async (event) => {
    event.preventDefault();
    try {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.removeItem('token');
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  });
});