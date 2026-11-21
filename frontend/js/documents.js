import { documents, categories, adminDepartments } from './api.js';
import { requireAuth, fileSize, isAdmin } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) init();

async function init() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const [catRes, deptRes] = await Promise.all([categories.list(), adminDepartments.list()]);
  const cats  = catRes.data  || [];
  const depts = deptRes.data || [];

  const catOpts  = cats.map(c  => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  const deptOpts = depts.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('');

  main.innerHTML = `
    <div class="page-heading">
      <div>
        <div class="eyebrow">THE TEAM LIBRARY</div>
        <h1>All documents<span class="greeting-dot">.</span></h1>
        <p>Find, share, and keep things moving.</p>
      </div>
      <button class="button primary" id="open-upload">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Upload document
      </button>
    </div>

    <div class="panel">
      <div class="library-heading">
        <h2>Document library <span class="count-badge" id="doc-count">—</span></h2>
        <span class="muted">Shared with your workspace</span>
      </div>
      <div class="filter-bar">
        <label class="search-field">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="search-input" placeholder="Search by title or filename…" />
        </label>
        <div class="filter-selects">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          <select id="filter-category"><option value="">All categories</option>${catOpts}</select>
          ${isAdmin() ? `<select id="filter-dept"><option value="">All departments</option>${deptOpts}</select>` : ''}
          <select id="filter-sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="titleAsc">Name A–Z</option>
            <option value="titleDesc">Name Z–A</option>
          </select>
        </div>
      </div>
      <div id="docs-container"><div class="loading"><span></span></div></div>
    </div>

    <div class="subtle-note"><span class="status-dot"></span>Documents are shared within your department. Administrators see all departments.</div>

    <!-- Upload modal -->
    <div class="modal-overlay" id="upload-modal" style="display:none" role="dialog" aria-modal="true">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Upload a document</h3>
          <button class="icon-button" id="close-upload">✕</button>
        </div>
        <form id="upload-form">
          <label>Title <span class="req">*</span><input type="text" id="upload-title" required placeholder="e.g. Q3 Financial Report" /></label>
          <label>Description <input type="text" id="upload-desc" placeholder="Optional short description" /></label>
          <label>Category <span class="req">*</span>
            <select id="upload-category" required><option value="">Select…</option>${catOpts}</select>
          </label>
          ${isAdmin() ? `<label>Department <span class="req">*</span><select id="upload-dept" required><option value="">Select…</option>${deptOpts}</select></label>` : ''}
          <label>File <span class="req">*</span>
            <div class="upload-zone" id="upload-zone">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
              <p>Click to browse or drag &amp; drop</p><small>PDF, DOCX, XLSX, TXT, PNG, JPEG — max 10 MB</small>
            </div>
            <input type="file" id="upload-file" style="display:none" accept=".pdf,.doc,.docx,.xlsx,.txt,.jpg,.jpeg,.png" />
            <div id="file-name-display" class="file-name-display"></div>
          </label>
          <button type="submit" class="button primary" id="upload-btn" style="width:100%;justify-content:center">Upload document</button>
        </form>
      </div>
    </div>

    <!-- Edit modal -->
    <div class="modal-overlay" id="edit-modal" style="display:none" role="dialog" aria-modal="true">
      <div class="modal-box">
        <div class="modal-header"><h3>Edit document</h3><button class="icon-button" id="close-edit">✕</button></div>
        <form id="edit-form">
          <input type="hidden" id="edit-id" />
          <label>Title<input type="text" id="edit-title" required /></label>
          <label>Description<input type="text" id="edit-desc" /></label>
          <label>Category<select id="edit-category" required><option value="">Select…</option>${catOpts}</select></label>
          <button type="submit" class="button primary" style="width:100%;justify-content:center">Save changes</button>
        </form>
      </div>
    </div>`;

  loadDocuments();
  bindSearch();
  bindUpload(depts);
  bindEditModal();
  bindModals();
}

async function loadDocuments(params = {}) {
  const container = document.getElementById('docs-container');
  if (!container) return;
  container.innerHTML = '<div class="loading"><span></span></div>';

  const res = await documents.list(params);
  if (!res.success) { showToast(res.message, 'error'); container.innerHTML = `<div class="empty-state"><p>${esc(res.message)}</p></div>`; return; }

  const count = document.getElementById('doc-count');
  if (count) count.textContent = res.pagination?.total ?? res.data?.length ?? 0;

  const docs = res.data || [];
  if (!docs.length) { container.innerHTML = `<div class="empty-state"><p>No documents found.</p></div>`; return; }

  container.innerHTML = `<table class="doc-table">
    <thead><tr><th>Title</th><th>Category</th><th>Department</th><th>Uploaded by</th><th>Size</th><th>Date</th><th></th></tr></thead>
    <tbody>${docs.map(d => `
      <tr>
        <td><span class="doc-name">${fileIcon(d.filename)} ${esc(d.title)}</span><div class="doc-filename">${esc(d.filename)}</div></td>
        <td><span class="category-chip">${esc(d.category?.name)}</span></td>
        <td>${esc(d.department?.name)}</td>
        <td>${esc(d.uploadedBy?.name)}</td>
        <td class="muted">${fileSize(d.sizeBytes)}</td>
        <td class="muted">${new Date(d.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        <td class="doc-actions">
          <button class="text-button btn-download" data-id="${d.id}" title="Download">↓</button>
          ${d.permissions?.canEdit   ? `<button class="text-button btn-edit"   data-id="${d.id}" data-title="${esc(d.title)}" data-desc="${esc(d.description||'')}" data-catid="${d.category?.id}">Edit</button>` : ''}
          ${d.permissions?.canDelete ? `<button class="text-button danger btn-delete" data-id="${d.id}" data-title="${esc(d.title)}">Delete</button>` : ''}
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;

  container.querySelectorAll('.btn-download').forEach(btn => {
    btn.addEventListener('click', async () => {
      const res = await documents.download(btn.dataset.id);
      if (res.success && res.data?.url && res.data.url !== '#mock-download') window.open(res.data.url, '_blank');
      else showToast('Download works once connected to AWS S3.', 'info');
    });
  });

  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('edit-id').value    = btn.dataset.id;
      document.getElementById('edit-title').value = btn.dataset.title;
      document.getElementById('edit-desc').value  = btn.dataset.desc;
      document.getElementById('edit-category').value = btn.dataset.catid;
      document.getElementById('edit-modal').style.display = 'flex';
    });
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`Delete "${btn.dataset.title}"? This cannot be undone.`)) return;
      const res = await documents.remove(btn.dataset.id);
      if (res.success) { showToast('Document deleted.', 'success'); loadDocuments(currentParams()); }
      else showToast(res.message, 'error');
    });
  });
}

function bindSearch() {
  let timer;
  document.getElementById('search-input')?.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => loadDocuments(currentParams()), 300); });
  document.getElementById('filter-category')?.addEventListener('change', () => loadDocuments(currentParams()));
  document.getElementById('filter-dept')?.addEventListener('change',     () => loadDocuments(currentParams()));
  document.getElementById('filter-sort')?.addEventListener('change',     () => loadDocuments(currentParams()));
}

function currentParams() {
  return {
    q:            document.getElementById('search-input')?.value.trim()   || undefined,
    categoryId:   document.getElementById('filter-category')?.value       || undefined,
    departmentId: document.getElementById('filter-dept')?.value           || undefined,
    sort:         document.getElementById('filter-sort')?.value           || undefined,
  };
}

function bindUpload(depts) {
  document.getElementById('upload-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const title    = document.getElementById('upload-title').value.trim();
    const desc     = document.getElementById('upload-desc').value.trim();
    const catId    = document.getElementById('upload-category').value;
    const deptId   = document.getElementById('upload-dept')?.value || user.departmentId;
    const file     = document.getElementById('upload-file').files[0];

    if (!title) { showToast('Title is required.', 'error'); return; }
    if (!catId) { showToast('Category is required.', 'error'); return; }
    if (!file)  { showToast('Select a file.', 'error'); return; }
    if (!deptId){ showToast('Department is required.', 'error'); return; }

    const btn = document.getElementById('upload-btn');
    btn.disabled = true; btn.textContent = 'Uploading…';

    // Step 1: get upload intent
    const intentRes = await documents.createUploadIntent({
      title, description: desc, categoryId: catId, departmentId: deptId,
      fileName: file.name, contentType: file.type, sizeBytes: file.size,
    });

    if (!intentRes.success) { showToast(intentRes.message, 'error'); btn.disabled = false; btn.textContent = 'Upload document'; return; }

    const { uploadId, upload } = intentRes.data;

    // Step 2: upload to S3 (mock skips actual S3 POST)
    if (upload.url !== '#mock-s3') {
      try {
        const fd = new FormData();
        Object.entries(upload.fields).forEach(([k, v]) => fd.append(k, v));
        fd.append('file', file);
        await fetch(upload.url, { method: 'POST', body: fd });
      } catch (err) {
        showToast('Upload to S3 failed.', 'error');
        btn.disabled = false; btn.textContent = 'Upload document';
        return;
      }
    }

    // Step 3: complete
    const completeRes = await documents.completeUpload(uploadId);
    btn.disabled = false; btn.textContent = 'Upload document';

    if (completeRes.success) {
      showToast('Document uploaded!', 'success');
      e.target.reset();
      document.getElementById('file-name-display').textContent = '';
      document.getElementById('upload-modal').style.display = 'none';
      loadDocuments();
    } else { showToast(completeRes.message, 'error'); }
  });

  document.getElementById('upload-zone')?.addEventListener('click', () => document.getElementById('upload-file').click());
  document.getElementById('upload-file')?.addEventListener('change', e => { document.getElementById('file-name-display').textContent = e.target.files[0]?.name || ''; });
  const zone = document.getElementById('upload-zone');
  zone?.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragging'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone?.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragging');
    const f = e.dataTransfer.files[0];
    if (f) { const dt = new DataTransfer(); dt.items.add(f); document.getElementById('upload-file').files = dt.files; document.getElementById('file-name-display').textContent = f.name; }
  });
}

function bindEditModal() {
  document.getElementById('edit-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id         = document.getElementById('edit-id').value;
    const title      = document.getElementById('edit-title').value.trim();
    const description = document.getElementById('edit-desc').value.trim();
    const categoryId = document.getElementById('edit-category').value;
    const res = await documents.update(id, { title, description, categoryId });
    if (res.success) { showToast('Saved.', 'success'); document.getElementById('edit-modal').style.display = 'none'; loadDocuments(currentParams()); }
    else showToast(res.message, 'error');
  });
}

function bindModals() {
  ['upload', 'edit'].forEach(name => {
    document.getElementById(`open-${name}`)?.addEventListener('click', () => document.getElementById(`${name}-modal`).style.display = 'flex');
    document.getElementById(`close-${name}`)?.addEventListener('click', () => document.getElementById(`${name}-modal`).style.display = 'none');
    document.getElementById(`${name}-modal`)?.addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.style.display = 'none'; });
  });
}

function fileIcon(name) {
  const ext = (name || '').split('.').pop().toLowerCase();
  if (ext === 'pdf') return '📄'; if (['doc','docx'].includes(ext)) return '📝'; if (['jpg','jpeg','png'].includes(ext)) return '🖼️'; return '📎';
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
