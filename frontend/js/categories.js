import { categories } from './mockApi.js';
import { requireAuth } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) init();

async function init() {
  const main = document.getElementById('main-content');
  if (!main) return;
  const isAdmin = user.role === 'admin';

  main.innerHTML = `
    <div class="page-heading">
      <div>
        <div class="eyebrow">MANAGEMENT</div>
        <h1>Categories<span class="greeting-dot">.</span></h1>
        <p>Organize your documents into logical groups.</p>
      </div>
    </div>
    <div class="management-layout">
      ${isAdmin ? `
      <div class="panel" style="max-width:320px">
        <div class="panel-heading"><div><h2>Add category</h2><p>Create a new document group.</p></div></div>
        <form id="add-cat-form" style="padding:1.25rem">
          <label>Category name<input type="text" id="cat-name" placeholder="e.g. Finance" required /></label>
          <button type="submit" class="button primary" style="width:100%;justify-content:center;margin-top:.75rem">Add category</button>
        </form>
      </div>` : ''}
      <div class="panel" style="flex:1">
        <div class="panel-heading"><div><h2>All categories</h2><p>Manage your document groups.</p></div></div>
        <div id="cats-container"><div class="loading"><span></span></div></div>
      </div>
    </div>`;

  loadCategories();
  if (isAdmin) bindAddForm();
}

async function loadCategories() {
  const container = document.getElementById('cats-container');
  if (!container) return;
  const res = await categories.list();
  if (!res.success) { showToast(res.message, 'error'); return; }

  if (!res.categories.length) {
    container.innerHTML = `<div class="empty-state"><p>No categories yet.</p></div>`;
    return;
  }

  container.innerHTML = `
    <table class="doc-table">
      <thead><tr><th>Category name</th><th></th></tr></thead>
      <tbody>${res.categories.map(c => `
        <tr>
          <td><strong>${esc(c.category_name)}</strong></td>
          <td class="doc-actions">
            ${user.role === 'admin' ? `<button class="text-button danger btn-delete-cat" data-id="${c.id}">Delete</button>` : ''}
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  container.querySelectorAll('.btn-delete-cat').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this category?')) return;
      const res = await categories.remove(btn.dataset.id);
      showToast(res.success ? 'Deleted.' : res.message, res.success ? 'success' : 'error');
      if (res.success) loadCategories();
    });
  });
}

function bindAddForm() {
  document.getElementById('add-cat-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('cat-name').value.trim();
    if (!name) return;
    const res = await categories.create({ category_name: name });
    showToast(res.success ? 'Category added.' : res.message, res.success ? 'success' : 'error');
    if (res.success) { document.getElementById('cat-name').value = ''; loadCategories(); }
  });
}

function esc(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
