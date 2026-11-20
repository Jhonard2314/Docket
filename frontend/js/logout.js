/**
 * logout.js — waits for sidebar to inject #logout-btn before binding.
 * Uses MutationObserver so it works regardless of injection timing.
 */
function bindLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      localStorage.removeItem('docket_user');
      window.location.href = 'login.html';
    });
    return true;
  }
  return false;
}

// Try immediately, then watch DOM for the button
if (!bindLogout()) {
  const observer = new MutationObserver(() => {
    if (bindLogout()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
