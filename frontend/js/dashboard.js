import { documents, categories } from './api.js';
import { requireAuth, renderUserInfo } from './auth.js';

(async () => {
  const user = await requireAuth();
  if (!user) return;
  renderUserInfo(user);

  // Fetch counts
  const [docsRes, catsRes] = await Promise.all([documents.list(), categories.list()]);

  const docCount = docsRes.success ? docsRes.documents.length : 0;
  const catCount = catsRes.success ? catsRes.categories.length : 0;

  document.getElementById('stat-docs').textContent  = docCount;
  document.getElementById('stat-cats').textContent  = catCount;

  // Show last 5 uploads in the recent table
  if (docsRes.success) {
    renderRecentDocs(docsRes.documents.slice(0, 5));
  }
})();

function renderRecentDocs(docs) {
  const tbody = document.getElementById('recent-docs-body');
  if (!docs.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No documents yet.</td></tr>';
    return;
  }
  tbody.innerHTML = docs.map((d) => `
    <tr>
      <td>${escHtml(d.filename)}</td>
      <td>${escHtml(d.category_name)}</td>
      <td>${escHtml(d.uploaded_by_name)}</td>
      <td>${new Date(d.upload_date).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
