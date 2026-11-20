import { categories } from './mockApi.js';
import { requireAuth, renderUserInfo } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) {
  renderUserInfo(user);
  loadCategories();
  if (user.role === 'admin') bindAddForm();
}

async function loadCategories() {
  const res = await categories.list();
  if (!res.success) { showToast(res.message, 'error'); return; }
  renderTable(res.categories);
}

function renderTable(cats) {
  const tbody = document.getElementById('cats-tbody');
  if (!cats.length) {
    tbody.innerHTML = `<tr><td colspan="2"><div class="empty-state"><i class="bi bi-tags"></i><p>No categories yet.</p></div></td></tr>`;
    return;
  }
  const isAdmin = user.role === 'admin';
  tbody.innerHTML = cats.map(c => `
    <tr>
      <td><strong>${esc(c.category_name)}</strong></td>
      <td>
        ${isAdmin ? `<button class="btn-danger btn-delete-cat" data-id="${c.id}">
          <i class="bi bi-trash"></i> Delete
        </button>` : '<span style="color:var(--text-muted);font-size:.8rem">—</span>'}
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('.btn-delete-cat').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this category?')) return;
      const res = await categories.remove(btn.dataset.id);
      showToast(res.success ? 'Deleted.' : res.message, res.success ? 'success' : 'error');
      if (res.success) await loadCategories();
    });
  });
}

function bindAddForm() {
  document.getElementById('add-category-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('category-name').value.trim();
    if (!name) { showToast('Name is required.', 'error'); return; }
    const res = await categories.create({ category_name: name });
    showToast(res.success ? 'Category added.' : res.message, res.success ? 'success' : 'error');
    if (res.success) {
      document.getElementById('category-name').value = '';
      await loadCategories();
    }
  });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
