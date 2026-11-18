import { categories } from './mockApi.js';
import { requireAuth, renderUserInfo } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) {
  renderUserInfo(user);
  loadCategories();
  bindAddForm();
}

async function loadCategories() {
  const res = await categories.list();
  if (!res.success) { showToast(res.message, 'error'); return; }
  renderTable(res.categories);
}

function renderTable(cats) {
  const tbody = document.getElementById('cats-tbody');
  if (!cats.length) {
    tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted py-4">No categories yet.</td></tr>';
    return;
  }
  tbody.innerHTML = cats.map((c) => `
    <tr>
      <td>${esc(c.category_name)}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger btn-delete-cat" data-id="${c.id}">
          <i class="bi bi-trash"></i> Delete
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-delete-cat').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this category?')) return;
      const res = await categories.remove(btn.dataset.id);
      if (res.success) { showToast('Category deleted.', 'success'); await loadCategories(); }
      else { showToast(res.message, 'error'); }
    });
  });
}

function bindAddForm() {
  document.getElementById('add-category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('category-name').value.trim();
    if (!name) { showToast('Category name is required.', 'error'); return; }
    const res = await categories.create({ category_name: name });
    if (res.success) {
      showToast('Category added.', 'success');
      document.getElementById('category-name').value = '';
      await loadCategories();
    } else {
      showToast(res.message, 'error');
    }
  });
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
