import { documents, categories } from './mockApi.js';
import { requireAuth } from './auth.js';
import { showToast } from './toast.js';

const user = requireAuth();
if (user) init();

async function init() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const catsRes = await categories.list();
  const cats = catsRes.success ? catsRes.categories : [];

  const catOpts = cats.map(c => `<option value="${c.id}">${esc(c.category_name)}</option>`).join('');

  main.innerHTML = `
    <div class="page-heading">
      <div>
        <div class="eyebrow">THE TEAM LIBRARY</div>
        <h1>All documents<span class="greeting-dot">.</span></h1>
        <p>A little organization goes a long way. Find, share, and keep things moving.</p>
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
          <input id="search-input" aria-label="Search documents" placeholder="Search by name or filename…" />
        </label>
        <div class="filter-selects">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          <select id="filter-category" aria-label="Filter by category">
            <option value="">All categories</option>
            ${catOpts}
          </select>
        </div>
      </div>
      <div id="docs-container"><div class="loading"><span></span></div></div>
    </div>

    <div class="subtle-note">
      <span class="status-dot"></span>
      Documents are visible based on your access level. Administrators can see all documents.
    </div>

    <!-- Upload modal -->
    <div class="modal-overlay" id="upload-modal" style="display:none" role="dialog" aria-modal="true" aria-label="Upload document">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Upload a document</h3>
          <button class="icon-button" id="close-upload" aria-label="Close">✕</button>
        </div>
        <form id="upload-form">
          <label>
            Category
            <select id="upload-category" required>
              <option value="">Select a category…</option>
              ${catOpts}
            </select>
          </label>
          <label>
            File
            <div class="upload-zone" id="upload-zone">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
              <p>Click to browse or drag &amp; drop</p>
              <small>PDF, Word, JPG, PNG — max 10 MB</small>
            </div>
            <input type="file" id="upload-file" style="display:none" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" />
            <div id="file-name-display" class="file-name-display"></div>
          </label>
          <button type="submit" class="button primary" id="upload-btn" style="width:100%;justify-content:center">Upload document</button>
        </form>
      </div>
    </div>`;

  loadDocuments();
  bindSearch();
  bindUpload();
}

async function loadDocuments(params = {}) {
  const container = document.getElementById('docs-container');
  if (!container) return;
  const res = await documents.list(params);
  if (!res.success) { showToast(res.message, 'error'); return; }

  const count = document.getElementById('doc-count');
  if (count) count.textContent = res.documents.length;

  if (!res.documents.length) {
    container.innerHTML = `<div class="empty-state"><p>No documents found.</p></div>`;
    return;
  }

  container.innerHTML = `
    <table class="doc-table">
      <thead><tr><th>Name</th><th>Category</th><th>Uploaded by</th><th>Date</th><th></th></tr></thead>
      <tbody>${res.documents.map(d => `
        <tr>
          <td><span class="doc-name">${fileIcon(d.filename)} ${esc(d.filename)}</span></td>
          <td><span class="category-chip">${esc(d.category_name)}</span></td>
          <td>${esc(d.uploaded_by_name)}</td>
          <td>${new Date(d.upload_date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
          <td class="doc-actions">
            <button class="text-button btn-rename" data-id="${d.id}" data-name="${esc(d.filename)}">Rename</button>
            <button class="text-button danger btn-delete" data-id="${d.id}">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  container.querySelectorAll('.btn-rename').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = prompt('New filename:', btn.dataset.name);
      if (!name?.trim()) return;
      const res = await documents.rename(btn.dataset.id, name.trim());
      showToast(res.success ? 'Renamed.' : res.message, res.success ? 'success' : 'error');
      if (res.success) loadDocuments(currentParams());
    });
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this document?')) return;
      const res = await documents.remove(btn.dataset.id);
      showToast(res.success ? 'Deleted.' : res.message, res.success ? 'success' : 'error');
      if (res.success) loadDocuments(currentParams());
    });
  });
}

function bindSearch() {
  let timer;
  document.getElementById('search-input')?.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => loadDocuments(currentParams()), 300);
  });
  document.getElementById('filter-category')?.addEventListener('change', () => loadDocuments(currentParams()));
}

function currentParams() {
  const search = document.getElementById('search-input')?.value.trim();
  const category_id = document.getElementById('filter-category')?.value;
  return { ...(search && { search }), ...(category_id && { category_id }) };
}

function bindUpload() {
  document.getElementById('open-upload')?.addEventListener('click', () => {
    document.getElementById('upload-modal').style.display = 'flex';
  });
  document.getElementById('close-upload')?.addEventListener('click', () => {
    document.getElementById('upload-modal').style.display = 'none';
  });
  document.getElementById('upload-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
  });
  document.getElementById('upload-zone')?.addEventListener('click', () => {
    document.getElementById('upload-file').click();
  });
  document.getElementById('upload-file')?.addEventListener('change', e => {
    document.getElementById('file-name-display').textContent = e.target.files[0]?.name || '';
  });

  const zone = document.getElementById('upload-zone');
  zone?.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragging'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone?.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragging');
    const f = e.dataTransfer.files[0];
    if (f) {
      const dt = new DataTransfer(); dt.items.add(f);
      document.getElementById('upload-file').files = dt.files;
      document.getElementById('file-name-display').textContent = f.name;
    }
  });

  document.getElementById('upload-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const file = document.getElementById('upload-file').files[0];
    const catId = document.getElementById('upload-category').value;
    if (!file)  { showToast('Select a file.', 'error'); return; }
    if (!catId) { showToast('Select a category.', 'error'); return; }
    const btn = document.getElementById('upload-btn');
    btn.disabled = true; btn.textContent = 'Uploading…';
    const fd = new FormData(); fd.append('file', file); fd.append('category_id', catId);
    const res = await documents.upload(fd);
    btn.disabled = false; btn.textContent = 'Upload document';
    if (res.success) {
      showToast('Uploaded!', 'success');
      e.target.reset();
      document.getElementById('file-name-display').textContent = '';
      document.getElementById('upload-modal').style.display = 'none';
      loadDocuments();
    } else { showToast(res.message, 'error'); }
  });
}

function fileIcon(name) {
  const ext = (name||'').split('.').pop().toLowerCase();
  if (ext==='pdf') return '📄'; if (['doc','docx'].includes(ext)) return '📝';
  if (['jpg','jpeg','png','gif'].includes(ext)) return '🖼️'; return '📎';
}
function esc(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
