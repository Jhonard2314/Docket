import { auth } from './api.js';
import { showToast } from './toast.js';

document.getElementById('login-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn   = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = 'Signing in…';

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errEl    = document.getElementById('login-error');

  const res = await auth.login({ email, password });

  if (res.success) {
    // Fetch the full user record from /api/me after login
    const meRes = await auth.me();
    if (meRes.success && meRes.data) {
      localStorage.setItem('docket_user', JSON.stringify(meRes.data));
      window.location.href = 'dashboard.html';
    } else {
      if (errEl) { errEl.textContent = 'Could not load user session.'; errEl.style.display = 'block'; }
      btn.disabled = false;
      btn.innerHTML = 'Sign in to Docket';
    }
  } else {
    if (errEl) { errEl.textContent = res.message || 'Invalid email or password.'; errEl.style.display = 'block'; }
    btn.disabled = false;
    btn.innerHTML = 'Sign in to Docket <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  }
});
