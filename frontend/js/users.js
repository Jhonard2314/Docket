import { users } from './mockApi.js';
import { requireAuth, renderUserInfo } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) {
  if (user.role !== 'admin') {
    window.location.href = 'dashboard.html';
  } else {
    renderUserInfo(user);
    loadUsers();
  }
}

async function loadUsers() {
  const res = await users.list();
  if (!res.success) { showToast(res.message, 'error'); return; }
  renderTable(res.users);
}

function renderTable(userList) {
  const tbody = document.getElementById('users-tbody');
  if (!userList.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No users found.</td></tr>';
    return;
  }
  tbody.innerHTML = userList.map((u) => `
    <tr>
      <td>${esc(u.name)}</td>
      <td>${esc(u.email)}</td>
      <td>
        <select class="form-select form-select-sm role-select" data-id="${u.id}" style="width:110px">
          <option value="user"  ${u.role === 'user'  ? 'selected' : ''}>User</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td>${new Date(u.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger btn-delete-user" data-id="${u.id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.role-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const res = await users.changeRole(sel.dataset.id, sel.value);
      if (res.success) showToast('Role updated.', 'success');
      else { showToast(res.message, 'error'); await loadUsers(); }
    });
  });

  tbody.querySelectorAll('.btn-delete-user').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this user and all their documents?')) return;
      const res = await users.remove(btn.dataset.id);
      if (res.success) { showToast('User deleted.', 'success'); await loadUsers(); }
      else { showToast(res.message, 'error'); }
    });
  });
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
