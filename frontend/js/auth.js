/**
 * auth.js — Session helpers using localStorage for mock mode.
 * When connected to the real backend, replace getUser() with an /api/auth/me call.
 */

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('docket_user'));
  } catch {
    return null;
  }
}

/**
 * Blocks access if no session. Redirects to login.
 * Returns the user object if authenticated.
 */
function requireAuth() {
  const user = getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

/**
 * Redirects to dashboard if already logged in.
 * Used on login/register pages.
 */
function redirectIfLoggedIn() {
  const user = getUser();
  if (user) {
    window.location.href = 'dashboard.html';
  }
}

/**
 * Populates sidebar name/role and shows admin-only elements.
 */
function renderUserInfo(user) {
  document.querySelectorAll('[data-user-name]').forEach((el) => {
    el.textContent = user.name;
  });
  document.querySelectorAll('[data-user-role]').forEach((el) => {
    el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  });
  if (user.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach((el) => el.classList.remove('d-none'));
  }
}

export { requireAuth, redirectIfLoggedIn, renderUserInfo, getUser };
