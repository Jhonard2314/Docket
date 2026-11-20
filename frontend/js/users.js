import { users } from './mockApi.js';
import { requireAuth } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) {
  if (user.role !== 'admin') { window.location.href = 'dashboard.html'; }
  else init();
}

async function init() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="page-heading">
      <div>
        <div class="eyebrow">MANAGEMENT</div>
        <h1>Team members<span class="greeting-dot">.</span></h1>
        <p>Manage who has access and what they can do.</p>
      </div>
    </div>
    <div class="panel">
      <div class="panel-heading"><div><h2>All members</h2><p>Manage roles and access.</p></div></div>
      <div id="users-container"><div class="loading"><span></span></div></div>
    </div>`;

  loadUsers();
}

async function loadUsers() {
  const container = document.getElementById('users-container');
  if (!container) return;
  const res = await users.list();
  if (!res.success) { showToast(res.message, 'error'); return; }

  if (!res.users.length) {
    container.innerHTML = `<div class="empty-state"><p>No users found.</p></div>`;
    return;
  }

  container.innerHTML = `
    <table class="doc-table">
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
      <tbody>${res.users.map(u => `
        <tr>
          <td>
            <span class="user-cell">
              <span class="avatar small">${initials(u.name)}</span>
              <strong>${esc(u.name)}</strong>
            </span>
          </td>
          <td class="muted">${esc(u.email)}</td>
          <td>
            <select class="role-select" data-id="${u.id}">
              <option value="user"            ${u.role==='user'            ?'selected':''}>Employee</option>
              <option value="department_head" ${u.role==='department_head' ?'selected':''}>Department head</option>
              <option value="admin"           ${u.role==='admin'           ?'selected':''}>Administrator</option>
            </select>
          </td>
          <td class="muted">${new Date(u.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
          <td class="doc-actions">
            <button class="text-button danger btn-delete-user" data-id="${u.id}">Remove</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  container.querySelectorAll('.role-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const res = await users.changeRole(sel.dataset.id, sel.value);
      showToast(res.success ? 'Role updated.' : res.message, res.success ? 'success' : 'error');
      if (!res.success) loadUsers();
    });
  });

  container.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this team member?')) return;
      const res = await users.remove(btn.dataset.id);
      showToast(res.success ? 'Removed.' : res.message, res.success ? 'success' : 'error');
      if (res.success) loadUsers();
    });
  });
}

function initials(name) { return (name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }
function esc(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
