/**
 * sidebar.js — Builds and injects the sidebar, marks the active nav link,
 * and renders the logged-in user's name/avatar/role.
 */
import { getUser } from './auth.js';

function getFileIcon(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (ext === 'pdf')                        return ['bi-file-earmark-pdf', 'file-icon-pdf'];
  if (['doc','docx'].includes(ext))         return ['bi-file-earmark-word', 'file-icon-doc'];
  if (['jpg','jpeg','png','gif'].includes(ext)) return ['bi-file-earmark-image', 'file-icon-img'];
  return ['bi-file-earmark', 'file-icon-other'];
}

function avatarLetter(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function injectSidebar() {
  const user    = getUser();
  const isAdmin = user?.role === 'admin';
  const page    = document.body.dataset.page || '';

  const html = `
  <aside class="sidebar">
    <div class="sidebar-brand">
      <i class="bi bi-folder2-open"></i>
      <span>Docket</span>
    </div>

    <div class="sidebar-label">Menu</div>
    <nav>
      <a href="./dashboard.html"  data-page="dashboard"  class="${page==='dashboard'  ? 'active' : ''}">
        <i class="bi bi-speedometer2"></i> Dashboard
      </a>
      <a href="./documents.html"  data-page="documents"  class="${page==='documents'  ? 'active' : ''}">
        <i class="bi bi-file-earmark-text"></i> Documents
      </a>
      <a href="./categories.html" data-page="categories" class="${page==='categories' ? 'active' : ''}">
        <i class="bi bi-tags"></i> Categories
      </a>
      ${isAdmin ? `
      <div class="sidebar-label">Admin</div>
      <a href="./users.html" data-page="users" class="${page==='users' ? 'active' : ''}">
        <i class="bi bi-people"></i> Users
      </a>` : ''}
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-avatar" id="sidebar-avatar">${avatarLetter(user?.name)}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name" data-user-name>${user?.name || '—'}</div>
          <div class="sidebar-user-role">${user?.role || ''}</div>
        </div>
      </div>
      <button id="logout-btn" class="btn-logout">
        <i class="bi bi-box-arrow-right"></i> Logout
      </button>
    </div>
  </aside>`;

  const wrapper = document.getElementById('app');
  if (!wrapper) return;
  const temp = document.createElement('div');
  temp.innerHTML = html.trim();
  wrapper.insertBefore(temp.firstChild, wrapper.firstChild);
}

export { injectSidebar, getFileIcon };
