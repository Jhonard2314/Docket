import { documents, categories } from './mockApi.js';
import { requireAuth, renderUserInfo } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) {
  renderUserInfo(user);
  loadCategories();
  loadDocuments();
  bindSearch();
  bindUploadForm();
}

async function loadDocuments(params = {}) {
  const res = await documents.list(params);
  if (!res.success) { showToast(res.message, 'error'); return; }
  renderDocTable(res.documents);
}

function renderDocTable(docs) {
  const tbody = document.getElementById('docs-tbody');
  if (!docs.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No documents found.</td></tr>';
    return;
  }
  tbody.innerHTML = docs.map((d) => `
    <tr>
      <td><i class="bi bi-file-earmark-text me-1 text-primary"></i>${esc(d.filename)}</td>
      <td>${esc(d.category_name)}</td>
      <td>${esc(d.uploaded_by_name)}</td>
      <td>${new Date(d.upload_date).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1 btn-download" data-id="${d.id}" title="Download">
          <i class="bi bi-download"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary me-1 btn-rename" data-id="${d.id}" data-name="${esc(d.filename)}" title="Rename">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${d.id}" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');

  tbody.addEventListener('click', handleTableAction, { once: true });
}

async function handleTableAction(e) {
  const btn = e.target.closest('button');
  if (!btn) { document.getElementById('docs-tbody').addEventListener('click', handleTableAction, { once: true }); return; }

  const id = btn.dataset.id;

  if (btn.classList.contains('btn-download')) {
    showToast('In mock mode, downloads open the actual file once connected to AWS S3.', 'info');
  }

  if (btn.classList.contains('btn-rename')) {
    const newName = prompt('Enter new filename:', btn.dataset.name);
    if (!newName || !newName.trim()) { await loadDocuments(currentParams()); return; }
    const res = await documents.rename(id, newName.trim());
    if (res.success) { showToast('Document renamed.', 'success'); }
    else { showToast(res.message, 'error'); }
    await loadDocuments(currentParams());
    return;
  }

  if (btn.classList.contains('btn-delete')) {
    if (!confirm('Delete this document? This cannot be undone.')) { await loadDocuments(currentParams()); return; }
    const res = await documents.remove(id);
    if (res.success) { showToast('Document deleted.', 'success'); }
    else { showToast(res.message, 'error'); }
    await loadDocuments(currentParams());
    return;
  }

  await loadDocuments(currentParams());
}

async function loadCategories() {
  const res = await categories.list();
  if (!res.success) return;
  const opts = res.categories.map(c => `<option value="${c.id}">${esc(c.category_name)}</option>`).join('');
  document.getElementById('filter-category').innerHTML = '<option value="">All Categories</option>' + opts;
  document.getElementById('upload-category').innerHTML = '<option value="">Select category…</option>' + opts;
}

function bindSearch() {
  document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await loadDocuments(currentParams());
  });
  document.getElementById('filter-category').addEventListener('change', async () => {
    await loadDocuments(currentParams());
  });
}

function currentParams() {
  const search      = document.getElementById('search-input').value.trim();
  const category_id = document.getElementById('filter-category').value;
  return { ...(search && { search }), ...(category_id && { category_id }) };
}

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

    const submitBtn = form.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading…';

    const res = await documents.upload(fd);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Upload';

    if (res.success) {
      showToast('File uploaded successfully!', 'success');
      form.reset();
      document.getElementById('file-name-display').textContent = '';
      bootstrap.Modal.getInstance(document.getElementById('uploadModal'))?.hide();
      await loadDocuments();
    } else {
      showToast(res.message, 'error');
    }
  });
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
