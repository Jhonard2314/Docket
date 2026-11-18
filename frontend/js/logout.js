import { auth } from './api.js';

/**
 * logout.js — Attached to every sidebar logout button.
 * Calls the API, then redirects to login.
 */
document.getElementById('logout-btn').addEventListener('click', async () => {
  await auth.logout();
  window.location.href = '/pages/login.html';
});
