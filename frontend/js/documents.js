import { documents, categories } from './api.js';
import { requireAuth, renderUserInfo } from './auth.js';
import { showToast } from './toast.js';

let currentUser = null;

(async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;
  renderUserInfo(currentUser);
  await loadCategories();
  await loadDocuments();
  bindSearch();
  bindUploadForm();
})();

// ── Load & render documents ───────────────────────────────────────────────────
async function loadDocuments(params = {}) {
  const res = await documents.list(params);
  if (!res.success) { showToast(res.message, 'error'); return; }
  renderDocTable(res.documents);
}

function renderDocTable(docs) {
  const tbody = document.getElementById('docs-tbody');
  if (!docs.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No documents found.</td></tr>';
    return;
  }
  tbody.innerHTML = docs.map((d) => `
    <tr data-id="${d.id}" data-s3key="${escHtml(d.s3_key)}">
      <td>
        <i class="bi bi-file-earmark-text me-1 text-primary"></i>
        <span class="doc-filename">${escHtml(d.filename)}</span>
      </td>
      <td>${escHtml(d.category_name)}</td>
      <td>${escHtml(d.uploaded_by_name)}</td>
      <td>${new Date(d.upload_date).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1 btn-download" data-id="${d.id}">
          <i class="bi bi-download"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary me-1 btn-rename" data-id="${d.id}" data-name="${escHtml(d.filename)}">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${d.id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');

  // Event delegation
  document.getElementById('docs-tbody').addEventListener('click', handleTableAction);
}

async function handleTableAction(e) {
  const btn = e.target.closest('button');
  if (!btn) return;

  const id = btn.dataset.id;

  if (btn.classList.contains('btn-download')) {
    const res = await documents.download(id);
    if (res.success) {
      window.open(res.url, '_blank');
    } else {
      showToast(res.message, 'error');
    }
  }

  if (btn.classList.contains('btn-rename')) {
    const newName = prompt('Enter new filename:', btn.dataset.name);
    if (!newName || !newName.trim()) return;
    const res = await documents.rename(id, newName.trim());
    if (res.success) {
      showToast('Document renamed.', 'success');
      await loadDocuments(currentSearchParams());
    } else {
      showToast(res.message, 'error');
    }
  }

  if (btn.classList.contains('btn-delete')) {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    const res = await documents.remove(id);
    if (res.success) {
      showToast('Document deleted.', 'success');
      await loadDocuments(currentSearchParams());
    } else {
      showToast(res.message, 'error');
    }
  }
}

// ── Categories dropdown ───────────────────────────────────────────────────────
async function loadCategories() {
  const res = await categories.list();
  if (!res.success) return;
  const opts = res.categories.map((c) => `<option value="${c.id}">${escHtml(c.category_name)}</option>`).join('');
  document.getElementById('filter-category').innerHTML = '<option value="">All Categories</option>' + opts;
  document.getElementById('upload-category').innerHTML = '<option value="">Select category…</option>' + opts;
}

// ── Search & filter ───────────────────────────────────────────────────────────
function bindSearch() {
  document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await loadDocuments(currentSearchParams());
  });
  document.getElementById('filter-category').addEventListener('change', async () => {
    await loadDocuments(currentSearchParams());
  });
}

function currentSearchParams() {
  const search = document.getElementById('search-input').value.trim();
  const category_id = document.getElementById('filter-category').value;
  return { ...(search && { search }), ...(category_id && { category_id }) };
}

// ── Upload form ───────────────────────────────────────────────────────────────
function bindUploadForm() {
  const form = document.getElementById('upload-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput  = document.getElementById('upload-file');
    const categoryId = document.getElementById('upload-category').value;

    if (!fileInput.files[0]) { showToast('Please select a file.', 'error'); return; }
    if (!categoryId)         { showToast('Please select a category.', 'error'); return; }

    const fd = new FormData();
    fd.append('file', fileInput.files[0]);
    fd.append('category_id', categoryId);

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Uploading…';

    const res = await documents.upload(fd);
    btn.disabled = false;
    btn.textContent = 'Upload';

    if (res.success) {
      showToast('File uploaded successfully!', 'success');
      form.reset();
      bootstrap.Modal.getInstance(document.getElementById('uploadModal'))?.hide();
      await loadDocuments();
    } else {
      showToast(res.message, 'error');
    }
  });
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
