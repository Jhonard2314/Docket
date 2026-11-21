import { auth } from './api.js';

function bindLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      await auth.logout();
      localStorage.removeItem('docket_user');
      window.location.href = 'login.html';
    });
    return true;
  }
  return false;
}

if (!bindLogout()) {
  const observer = new MutationObserver(() => {
    if (bindLogout()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
