import { auth } from './mockApi.js';
import { showToast } from './toast.js';

const form = document.getElementById('login-form');
const btn  = document.getElementById('login-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  btn.disabled = true;
  btn.textContent = 'Logging in…';

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const res = await auth.login({ email, password });
  if (res.success) {
    // Store session in localStorage so other pages can read it
    localStorage.setItem('docket_user', JSON.stringify(res.user));
    window.location.href = 'dashboard.html';
  } else {
    showToast(res.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Log In';
  }
});
