// Common client-side script for Side Hustle Trader
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on a login/landing page, if so we don't force auth
    const path = window.location.pathname;
    const isPublicPage = path.endsWith('login.html') || path.endsWith('index.html') || path.endsWith('about.html') || path.endsWith('contact.html') || path.endsWith('service.html') || path.endsWith('team.html') || path.endsWith('testimonial.html') || path === '/' || path === '';
    
    // Add logout hook to navbar if we are logged in
    fetch('/api/auth/me')
        .then(res => {
            if (!res.ok) {
                if (!isPublicPage) {
                    window.location.href = '/login.html';
                }
                throw new Error('Not logged in');
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                window.currentUser = data.user;
                updateCommonUI(data.user);
            }
        })
        .catch(err => {
            console.log('Session status: Guest');
        });
});

function updateCommonUI(user) {
    // Replace "User" or "Log In" navbar text with User's Nickname or Name
    const userNavBtn = document.querySelector('a[href="profile.html"], a[href="login.html"]');
    if (userNavBtn) {
        userNavBtn.textContent = user.nickname || user.name;
        userNavBtn.setAttribute('href', 'profile.html');
    }
    
    // Check if we should add an Admin and Logout link/button to the nav menu
    const navCollapse = document.getElementById('navbarCollapse');
    if (navCollapse) {
        const navMenu = navCollapse.querySelector('.navbar-nav');
        if (navMenu) {
            // Add Admin link if user is admin
            if (user.is_admin && !document.getElementById('admin-nav-item')) {
                const adminLink = document.createElement('a');
                adminLink.className = 'nav-item nav-link text-warning';
                adminLink.id = 'admin-nav-item';
                adminLink.href = 'admin.html';
                adminLink.innerHTML = '<i class="fas fa-shield-alt me-1"></i>Admin';
                navMenu.appendChild(adminLink);
            }

            // Add Logout link
            if (!document.getElementById('logout-nav-item')) {
                const logoutLi = document.createElement('a');
                logoutLi.className = 'nav-item nav-link text-danger';
                logoutLi.id = 'logout-nav-item';
                logoutLi.href = '#';
                logoutLi.innerHTML = '<i class="fas fa-sign-out-alt me-1"></i>Logout';
                logoutLi.addEventListener('click', (e) => {
                    e.preventDefault();
                    logoutUser();
                });
                navMenu.appendChild(logoutLi);
            }
        }
    }
}

function logoutUser() {
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/index.html';
        }
    })
    .catch(err => console.error('Logout error:', err));
}

// Make globally available
window.logoutUser = logoutUser;
