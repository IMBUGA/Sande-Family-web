/* Preloader */
window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 1000);
});

/* Theme Toggle with Local Storage */
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

if (themeToggle) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark');
        const currentTheme = body.classList.contains('dark') ? 'dark' : '';
        localStorage.setItem('theme', currentTheme);
    });
}

/* Scroll Animations */
const sections = document.querySelectorAll('section');

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

sections.forEach(section => {
    observer.observe(section);
});

/* Authentication Functionality */
const signinForm = document.getElementById('signin-form');
const resetForm = document.getElementById('reset-form');
const resetConfirmForm = document.getElementById('reset-confirm-form');
const notificationContainer = document.getElementById('notification-container');

if (signinForm && resetForm && resetConfirmForm) {
    // Tab Switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const forgotPasswordLink = document.querySelector('.forgot-password');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            document.querySelector('[data-tab="reset"]').classList.add('active');
            document.getElementById('reset').classList.add('active');
        });
    }

    // Sign In
    signinForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(signinForm);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password
                }),
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Sign in successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                showNotification(result.error || 'Invalid email or password!', 'error');
            }
        } catch (error) {
            showNotification('An error occurred. Please try again.', 'error');
            console.error('Sign in error:', error);
        }
    });

    // Password Reset Request
    resetForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(resetForm);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email })
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Password reset token generated. Please check your email.', 'success');
                resetForm.style.display = 'none';
                resetConfirmForm.style.display = 'block';
                resetConfirmForm.querySelector('input[name="token"]').value = result.token;
            } else {
                showNotification(result.error || 'Failed to request password reset.', 'error');
            }
        } catch (error) {
            showNotification('An error occurred. Please try again.', 'error');
            console.error('Reset request error:', error);
        }
    });

    // Password Reset Confirmation
    resetConfirmForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(resetConfirmForm);
        const data = Object.fromEntries(formData);

        if (data.newPassword !== data['confirm-newPassword']) {
            showNotification('Passwords do not match!', 'error');
            return;
        }

        try {
            const response = await fetch('/api/reset-password/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: data.token,
                    newPassword: data.newPassword
                })
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Password reset successfully! Redirecting to sign in...', 'success');
                setTimeout(() => {
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    document.querySelector('[data-tab="signin"]').classList.add('active');
                    document.getElementById('signin').classList.add('active');
                    resetForm.style.display = 'block';
                    resetConfirmForm.style.display = 'none';
                    resetConfirmForm.reset();
                }, 2000);
            } else {
                showNotification(result.error || 'Failed to reset password.', 'error');
            }
        } catch (error) {
            showNotification('An error occurred. Please try again.', 'error');
            console.error('Reset confirm error:', error);
        }
    });
}

/* Protect Routes */
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        const data = await response.json();
        if (!data.success && window.location.pathname !== '/auth') {
            window.location.href = '/auth';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        if (window.location.pathname !== '/auth') {
            window.location.href = '/auth';
        }
    }
}

// Run auth check on page load
document.addEventListener('DOMContentLoaded', checkAuth);

/* Sign Out */
document.querySelectorAll('a[href="#signout"]').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Signed out successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/auth';
                }, 2000);
            } else {
                showNotification('Logout failed!', 'error');
            }
        } catch (error) {
            showNotification('An error occurred. Please try again.', 'error');
            console.error('Logout error:', error);
        }
    });
});
