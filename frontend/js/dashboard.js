import { documents, categories, users } from './mockApi.js';
import { requireAuth, renderUserInfo } from './auth.js';

const user = requireAuth();
if (user) {
  renderUserInfo(user);
  loadStats();
}

async function loadStats() {
  const [docsRes, catsRes, usersRes] = await Promise.all([
    documents.list(),
    categories.list(),
    users.list(),
  ]);

  document.getElementById('stat-docs').textContent  = docsRes.success  ? docsRes.documents.length  : '—';
  document.getElementById('stat-cats').textContent  = catsRes.success  ? catsRes.categories.length : '—';
  document.getElementById('stat-users').textContent = usersRes.success ? usersRes.users.length     : '—';

  const roleMap = { admin: 'Admin', user: 'User', department_head: 'Dept Head' };
  document.getElementById('stat-role').textContent = roleMap[user.role] ?? user.role;

  if (docsRes.success) renderRecentDocs(docsRes.documents.slice(0, 5));
}

function renderRecentDocs(docs) {
  const tbody = document.getElementById('recent-docs-body');
  if (!docs.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">
      <i class="bi bi-inbox"></i><p>No documents yet.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = docs.map(d => `
    <tr>
      <td><div class="file-cell">${fileIcon(d.filename)}<span>${esc(d.filename)}</span></div></td>
      <td>${esc(d.category_name)}</td>
      <td>${esc(d.uploaded_by_name)}</td>
      <td>${new Date(d.upload_date).toLocaleDateString()}</td>
    </tr>`).join('');
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf')               return '<i class="bi bi-file-earmark-pdf file-icon-pdf"></i>';
  if (['doc','docx'].includes(ext)) return '<i class="bi bi-file-earmark-word file-icon-doc"></i>';
  if (['jpg','jpeg','png','gif'].includes(ext)) return '<i class="bi bi-file-earmark-image file-icon-img"></i>';
  return '<i class="bi bi-file-earmark file-icon-other"></i>';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
