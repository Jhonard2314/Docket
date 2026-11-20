import { categories } from './mockApi.js';
import { requireAuth, isAdmin } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) init();

async function init() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="page-heading">
      <div><div class="eyebrow">MANAGEMENT</div><h1>Categories<span class="greeting-dot">.</span></h1><p>Organize documents into logical groups.</p></div>
    </div>
    <div class="management-layout">
      ${isAdmin() ? `
      <div class="panel" style="max-width:300px">
        <div class="panel-heading"><div><h2>Add category</h2></div></div>
        <form id="add-cat-form" style="padding:1.25rem;display:flex;flex-direction:column;gap:.75rem">
          <label style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--muted)">Name<input type="text" id="cat-name" placeholder="e.g. Reports" required style="margin-top:.3rem;width:100%;padding:.575rem .75rem;border:1.5px solid var(--border);border-radius:7px;font-size:13px;font-family:inherit;outline:none" /></label>
          <button type="submit" class="button primary" style="justify-content:center">Add category</button>
        </form>
      </div>` : ''}
      <div class="panel" style="flex:1">
        <div class="panel-heading"><div><h2>All categories</h2></div></div>
        <div id="cats-container"><div class="loading"><span></span></div></div>
      </div>
    </div>`;

  load();
  if (isAdmin()) {
    document.getElementById('add-cat-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('cat-name').value.trim();
      const res = await categories.create({ name });
      if (res.success) { showToast('Category added.', 'success'); document.getElementById('cat-name').value = ''; load(); }
      else showToast(res.message, 'error');
    });
  }
}

async function load() {
  const c = document.getElementById('cats-container');
  if (!c) return;
  const res = await categories.list();
  if (!res.success) { showToast(res.message, 'error'); return; }
  if (!res.data?.length) { c.innerHTML = `<div class="empty-state"><p>No categories yet.</p></div>`; return; }
  c.innerHTML = `<table class="doc-table"><thead><tr><th>Name</th><th></th></tr></thead><tbody>
    ${res.data.map(cat => `<tr><td><strong>${esc(cat.name)}</strong></td><td class="doc-actions">
      ${isAdmin() ? `<button class="text-button danger btn-del-cat" data-id="${cat.id}">Delete</button>` : ''}
    </td></tr>`).join('')}
  </tbody></table>`;
  c.querySelectorAll('.btn-del-cat').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this category?')) return;
      const r = await categories.remove(btn.dataset.id);
      if (r.success) { showToast('Deleted.', 'success'); load(); } else showToast(r.message, 'error');
    });
  });
}

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
