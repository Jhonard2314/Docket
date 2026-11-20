import { auth } from './mockApi.js';
import { showToast } from './toast.js';

document.getElementById('register-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm-password').value;
  const errEl    = document.getElementById('register-error');

  if (password !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Create account';
    return;
  }

  const res = await auth.register({ name, email, password });
  if (res.success) {
    showToast('Account created! Redirecting…', 'success');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
  } else {
    errEl.textContent = res.message;
    errEl.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Create account';
  }
});
