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
  renderTable(res.documents);
  const counter = document.getElementById('doc-count');
  if (counter) counter.textContent = res.documents.length + ' files';
}

function renderTable(docs) {
  const tbody = document.getElementById('docs-tbody');
  if (!docs.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">
      <i class="bi bi-inbox"></i><p>No documents found.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = docs.map(d => `
    <tr>
      <td><div class="file-cell">${fileIcon(d.filename)}<span>${esc(d.filename)}</span></div></td>
      <td>${esc(d.category_name)}</td>
      <td>${esc(d.uploaded_by_name)}</td>
      <td>${new Date(d.upload_date).toLocaleDateString()}</td>
      <td>
        <div class="actions">
          <button class="btn-icon download btn-download" data-id="${d.id}" title="Download"><i class="bi bi-download"></i></button>
          <button class="btn-icon rename  btn-rename"   data-id="${d.id}" data-name="${esc(d.filename)}" title="Rename"><i class="bi bi-pencil"></i></button>
          <button class="btn-icon delete  btn-delete"   data-id="${d.id}" title="Delete"><i class="bi bi-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');

  document.getElementById('docs-tbody').addEventListener('click', handleAction, { once: true });
}

async function handleAction(e) {
  const btn = e.target.closest('button');
  const tbody = document.getElementById('docs-tbody');
  if (!btn) { tbody.addEventListener('click', handleAction, { once: true }); return; }

  const id = btn.dataset.id;

  if (btn.classList.contains('btn-download')) {
    showToast('Download works once connected to AWS S3.', 'info');
    tbody.addEventListener('click', handleAction, { once: true });
    return;
  }

  if (btn.classList.contains('btn-rename')) {
    const newName = prompt('New filename:', btn.dataset.name);
    if (!newName?.trim()) { await loadDocuments(currentParams()); return; }
    const res = await documents.rename(id, newName.trim());
    showToast(res.success ? 'Renamed.' : res.message, res.success ? 'success' : 'error');
    await loadDocuments(currentParams());
    return;
  }

  if (btn.classList.contains('btn-delete')) {
    if (!confirm('Delete this document?')) { await loadDocuments(currentParams()); return; }
    const res = await documents.remove(id);
    showToast(res.success ? 'Deleted.' : res.message, res.success ? 'success' : 'error');
    await loadDocuments(currentParams());
  }
}

async function loadCategories() {
  const res = await categories.list();
  if (!res.success) return;
  const opts = res.categories.map(c => `<option value="${c.id}">${esc(c.category_name)}</option>`).join('');
  document.getElementById('filter-category').innerHTML = '<option value="">All Categories</option>' + opts;
  document.getElementById('upload-category').innerHTML = '<option value="">Select category…</option>' + opts;
}

function bindSearch() {
  document.getElementById('search-form').addEventListener('submit', async e => {
    e.preventDefault();
    await loadDocuments(currentParams());
  });
  document.getElementById('filter-category').addEventListener('change', () => loadDocuments(currentParams()));
}

function currentParams() {
  const search      = document.getElementById('search-input').value.trim();
  const category_id = document.getElementById('filter-category').value;
  return { ...(search && { search }), ...(category_id && { category_id }) };
}

function bindUploadForm() {
  document.getElementById('upload-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fileInput  = document.getElementById('upload-file');
    const categoryId = document.getElementById('upload-category').value;
    if (!fileInput.files[0]) { showToast('Select a file first.', 'error'); return; }
    if (!categoryId)         { showToast('Select a category.', 'error'); return; }

    const fd = new FormData();
    fd.append('file', fileInput.files[0]);
    fd.append('category_id', categoryId);

    const btn = document.getElementById('upload-submit-btn');
    btn.disabled = true; btn.textContent = 'Uploading…';

    const res = await documents.upload(fd);
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-upload"></i> Upload';

    if (res.success) {
      showToast('Uploaded!', 'success');
      e.target.reset();
      document.getElementById('file-name-display').textContent = '';
      document.getElementById('upload-modal').style.display = 'none';
      await loadDocuments();
    } else {
      showToast(res.message, 'error');
    }
  });
}

function fileIcon(name) {
  const ext = (name || '').split('.').pop().toLowerCase();
  if (ext === 'pdf')               return '<i class="bi bi-file-earmark-pdf file-icon-pdf"></i>';
  if (['doc','docx'].includes(ext)) return '<i class="bi bi-file-earmark-word file-icon-doc"></i>';
  if (['jpg','jpeg','png','gif'].includes(ext)) return '<i class="bi bi-file-earmark-image file-icon-img"></i>';
  return '<i class="bi bi-file-earmark file-icon-other"></i>';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
