import { auth } from './mockApi.js';
import { showToast } from './toast.js';

const form = document.getElementById('register-form');
const btn  = document.getElementById('register-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm-password').value;

  if (password !== confirm) {
    showToast('Passwords do not match.', 'error');
    btn.disabled = false;
    btn.textContent = 'Create Account';
    return;
  }

  const res = await auth.register({ name, email, password });
  if (res.success) {
    showToast('Account created! Redirecting to login…', 'success');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
  } else {
    showToast(res.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});
