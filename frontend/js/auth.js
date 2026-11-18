/**
 * auth.js — Session guard helpers used on every protected page.
 */
import { auth } from './api.js';

/**
 * Fetches the current session user.
 * Redirects to login if not authenticated.
 * @returns {Promise<{id, name, role}>}
 */
async function requireAuth() {
  const res = await auth.me();
  if (!res.success) {
    window.location.href = '/pages/login.html';
    return null;
  }
  return res.user;
}

/**
 * Redirects to the dashboard if the user is already logged in.
 * Used on login/register pages.
 */
async function redirectIfLoggedIn() {
  const res = await auth.me();
  if (res.success) {
    window.location.href = '/pages/dashboard.html';
  }
}

/**
 * Populates any element with [data-user-name] with the session user's name.
 */
function renderUserInfo(user) {
  document.querySelectorAll('[data-user-name]').forEach((el) => {
    el.textContent = user.name;
  });
  document.querySelectorAll('[data-user-role]').forEach((el) => {
    el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  });
  // Show/hide admin-only UI
  if (user.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach((el) => el.classList.remove('d-none'));
  }
}

export { requireAuth, redirectIfLoggedIn, renderUserInfo };
