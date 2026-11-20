import { adminDepartments } from './mockApi.js';
import { requireAuth, isAdmin } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) { if (!isAdmin()) { window.location.href = 'dashboard.html'; } else init(); }

async function init() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="page-heading">
      <div><div class="eyebrow">MANAGEMENT</div><h1>Departments<span class="greeting-dot">.</span></h1><p>Organize your team by department.</p></div>
    </div>
    <div class="management-layout">
      <div class="panel" style="max-width:300px">
        <div class="panel-heading"><div><h2>Add department</h2></div></div>
        <form id="add-dept-form" style="padding:1.25rem;display:flex;flex-direction:column;gap:.75rem">
          <label style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--muted)">Name<input type="text" id="dept-name" placeholder="e.g. Engineering" required style="margin-top:.3rem;width:100%;padding:.575rem .75rem;border:1.5px solid var(--border);border-radius:7px;font-size:13px;font-family:inherit;outline:none" /></label>
          <button type="submit" class="button primary" style="justify-content:center">Add department</button>
        </form>
      </div>
      <div class="panel" style="flex:1">
        <div class="panel-heading"><div><h2>All departments</h2></div></div>
        <div id="depts-container"><div class="loading"><span></span></div></div>
      </div>
    </div>`;

  load();

  document.getElementById('add-dept-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('dept-name').value.trim();
    const res = await adminDepartments.create({ name });
    if (res.success) { showToast('Department added.', 'success'); document.getElementById('dept-name').value = ''; load(); }
    else showToast(res.message, 'error');
  });
}

async function load() {
  const c = document.getElementById('depts-container');
  if (!c) return;
  const res = await adminDepartments.list();
  if (!res.success) { showToast(res.message, 'error'); return; }
  if (!res.data?.length) { c.innerHTML = `<div class="empty-state"><p>No departments yet.</p></div>`; return; }
  c.innerHTML = `<table class="doc-table"><thead><tr><th>Name</th><th></th></tr></thead><tbody>
    ${res.data.map(d => `<tr><td><strong>${esc(d.name)}</strong></td><td class="doc-actions">
      <button class="text-button danger btn-del-dept" data-id="${d.id}">Delete</button></td></tr>`).join('')}
  </tbody></table>`;
  c.querySelectorAll('.btn-del-dept').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this department?')) return;
      const r = await adminDepartments.remove(btn.dataset.id);
      if (r.success) { showToast('Deleted.', 'success'); load(); } else showToast(r.message, 'error');
    });
  });
}

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
