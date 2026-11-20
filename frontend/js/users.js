import { users } from './mockApi.js';
import { requireAuth, renderUserInfo } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) {
  if (user.role !== 'admin') { window.location.href = 'dashboard.html'; }
  else { renderUserInfo(user); loadUsers(); }
}

async function loadUsers() {
  const res = await users.list();
  if (!res.success) { showToast(res.message, 'error'); return; }
  renderTable(res.users);
}

function renderTable(list) {
  const tbody = document.getElementById('users-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="bi bi-people"></i><p>No users.</p></div></td></tr>`;
    return;
  }
  const roleOpts = (cur) => ['user','admin'].map(r =>
    `<option value="${r}" ${cur === r ? 'selected' : ''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`
  ).join('');

  tbody.innerHTML = list.map(u => `
    <tr>
      <td><strong>${esc(u.name)}</strong></td>
      <td style="color:var(--text-muted)">${esc(u.email)}</td>
      <td>
        <select class="role-select" data-id="${u.id}">${roleOpts(u.role)}</select>
      </td>
      <td style="color:var(--text-muted)">${new Date(u.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn-danger btn-delete-user" data-id="${u.id}">
          <i class="bi bi-trash"></i> Delete
        </button>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('.role-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const res = await users.changeRole(sel.dataset.id, sel.value);
      showToast(res.success ? 'Role updated.' : res.message, res.success ? 'success' : 'error');
      if (!res.success) await loadUsers();
    });
  });

  tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this user and all their documents?')) return;
      const res = await users.remove(btn.dataset.id);
      showToast(res.success ? 'User deleted.' : res.message, res.success ? 'success' : 'error');
      if (res.success) await loadUsers();
    });
  });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
