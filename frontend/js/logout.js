document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('docket_user');
  window.location.href = 'login.html';
});
