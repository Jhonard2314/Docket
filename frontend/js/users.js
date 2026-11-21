import { adminUsers, adminDepartments } from './api.js';
import { requireAuth, isAdmin } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) { if (!isAdmin()) { window.location.href = 'dashboard.html'; } else init(); }

async function init() {
  const main = document.getElementById('main-content');
  if (!main) return;
  const deptRes = await adminDepartments.list();
  const depts   = deptRes.data || [];
  const deptOpts = `<option value="">No department</option>` + depts.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('');

  main.innerHTML = `
    <div class="page-heading">
      <div><div class="eyebrow">MANAGEMENT</div><h1>Team members<span class="greeting-dot">.</span></h1><p>Manage roles and department access.</p></div>
    </div>
    <div class="panel">
      <div class="panel-heading"><div><h2>All members</h2></div></div>
      <div id="users-container"><div class="loading"><span></span></div></div>
    </div>`;

  load(depts, deptOpts);
}

async function load(depts, deptOpts) {
  const c = document.getElementById('users-container');
  if (!c) return;
  const res = await adminUsers.list();
  if (!res.success) { showToast(res.message, 'error'); return; }
  if (!res.data?.length) { c.innerHTML = `<div class="empty-state"><p>No users.</p></div>`; return; }

  c.innerHTML = `<table class="doc-table">
    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th></th></tr></thead>
    <tbody>${res.data.map(u => `
      <tr>
        <td><span class="user-cell"><span class="avatar small">${initials(u.name)}</span><strong>${esc(u.name)}</strong></span></td>
        <td class="muted">${esc(u.email)}</td>
        <td>
          <select class="role-select" data-id="${u.id}">
            <option value="EMPLOYEE"       ${u.role==='EMPLOYEE'       ?'selected':''}>Employee</option>
            <option value="DEPARTMENT_HEAD"${u.role==='DEPARTMENT_HEAD'?'selected':''}>Dept Head</option>
            <option value="ADMIN"          ${u.role==='ADMIN'          ?'selected':''}>Admin</option>
          </select>
        </td>
        <td>
          <select class="role-select" data-id="${u.id}" data-type="dept">
            ${deptOpts.replace(`value="${u.departmentId}"`, `value="${u.departmentId}" selected`)}
          </select>
        </td>
        <td><span class="status-badge ${u.isActive ? 'active' : 'inactive'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
        <td class="doc-actions">
          ${u.isActive ? `<button class="text-button danger btn-deactivate" data-id="${u.id}">Deactivate</button>` : ''}
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;

  c.querySelectorAll('.role-select[data-type!="dept"]').forEach(sel => {
    sel.addEventListener('change', async () => {
      const r = await adminUsers.update(sel.dataset.id, { role: sel.value });
      showToast(r.success ? 'Role updated.' : r.message, r.success ? 'success' : 'error');
    });
  });

  c.querySelectorAll('.role-select[data-type="dept"]').forEach(sel => {
    sel.addEventListener('change', async () => {
      const r = await adminUsers.update(sel.dataset.id, { departmentId: sel.value || null });
      showToast(r.success ? 'Department updated.' : r.message, r.success ? 'success' : 'error');
    });
  });

  c.querySelectorAll('.btn-deactivate').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Deactivate this user?')) return;
      const r = await adminUsers.remove(btn.dataset.id);
      showToast(r.success ? 'User deactivated.' : r.message, r.success ? 'success' : 'error');
      if (r.success) load(depts, deptOpts);
    });
  });
}

function initials(name) { return (name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
