import { documents, categories } from './mockApi.js';
import { requireAuth, renderUserInfo } from './auth.js';

const user = requireAuth();
if (user) {
  renderUserInfo(user);
  loadStats();
}

async function loadStats() {
  const [docsRes, catsRes] = await Promise.all([
    documents.list(),
    categories.list(),
  ]);

  document.getElementById('stat-docs').textContent = docsRes.success ? docsRes.documents.length : '—';
  document.getElementById('stat-cats').textContent = catsRes.success ? catsRes.categories.length : '—';

  if (docsRes.success) renderRecentDocs(docsRes.documents.slice(0, 5));
}

function renderRecentDocs(docs) {
  const tbody = document.getElementById('recent-docs-body');
  if (!docs.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No documents yet.</td></tr>';
    return;
  }
  tbody.innerHTML = docs.map((d) => `
    <tr>
      <td>${esc(d.filename)}</td>
      <td>${esc(d.category_name)}</td>
      <td>${esc(d.uploaded_by_name)}</td>
      <td>${new Date(d.upload_date).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
