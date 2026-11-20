import { getUser } from './auth.js';

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function injectSidebar() {
  const user   = getUser();
  const page   = document.body.dataset.page || '';
  const isAdmin = user?.role === 'admin';

  const nav = [
    { href: './dashboard.html',   page: 'dashboard',  label: 'Overview',       icon: iconDashboard() },
    { href: './documents.html',   page: 'documents',  label: 'All documents',  icon: iconFiles() },
  ];
  const mgmt = [
    { href: './users.html',       page: 'users',       label: 'Team members',  icon: iconUsers() },
    { href: './categories.html',  page: 'categories',  label: 'Categories',    icon: iconTags() },
  ];

  const navLink = (n) => `
    <a href="${n.href}" class="nav-link ${page === n.page ? 'active' : ''}">
      ${n.icon}${n.label}
      ${page === n.page ? '<span class="nav-dot"></span>' : ''}
    </a>`;

  const html = `
  <aside class="sidebar" id="sidebar">
    <a href="./dashboard.html" class="brand">
      <span class="brand-mark">${iconLayers()}</span>
      docket<span class="brand-period">.</span>
    </a>
    <button class="mobile-close icon-button" id="close-nav" aria-label="Close navigation">✕</button>

    <div class="workspace-label">
      <span class="workspace-icon">D</span>
      <div>Docket workspace<small>Document management</small></div>
    </div>

    <p class="nav-label">WORKSPACE</p>
    <nav aria-label="Workspace">${nav.map(navLink).join('')}</nav>

    ${isAdmin ? `
    <p class="nav-label admin-label">MANAGEMENT</p>
    <nav aria-label="Administration">${mgmt.map(navLink).join('')}</nav>
    ` : ''}

    <div class="sidebar-bottom">
      <div class="sidebar-note">
        ${iconShield()}
        <strong>A little more organized.</strong>
        <p>One shared space for everything your team needs.</p>
        <a href="./documents.html">Add a document ↗</a>
      </div>
      <div class="local-indicator"><span></span>Local preview <span class="local-tag">DEMO</span></div>
      <button class="logout" id="logout-btn">${iconLogout()} Sign out</button>
    </div>
  </aside>

  <div class="main-shell">
    <header class="topbar">
      <div class="breadcrumb">
        <button class="mobile-menu icon-button" id="open-nav" aria-label="Open navigation">☰</button>
        <span>Workspace</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        <strong>${pageLabel(page)}</strong>
      </div>
      <div class="topbar-right">
        <span class="today">${new Date().toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</span>
        <span class="topbar-divider"></span>
        <div class="user-info">
          <strong>${esc(user?.name || '—')}</strong>
          <small>${roleLabel(user?.role)}</small>
        </div>
        <span class="avatar">${initials(user?.name)}</span>
      </div>
    </header>
    <main id="main-content">`;

  // Inject into #app wrapper
  const app = document.getElementById('app');
  if (!app) return;
  const temp = document.createElement('div');
  temp.innerHTML = html;
  while (temp.firstChild) app.appendChild(temp.firstChild);

  // Mobile nav toggle
  document.getElementById('open-nav')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.add('is-open');
  });
  document.getElementById('close-nav')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('is-open');
  });
}

function closeSidebar() {
  // Close the main-shell main tag after page content
  const main = document.getElementById('main-content');
  if (!main) return;
  const footer = document.createElement('footer');
  footer.className = 'page-footer';
  footer.innerHTML = '<span>Less searching. More doing.</span><span>Docket · Your documents, together.</span>';
  main.parentElement?.appendChild(footer);
}

function pageLabel(page) {
  return { dashboard:'Overview', documents:'Documents', categories:'Management', users:'Management' }[page] || 'Workspace';
}
function roleLabel(role) {
  return { admin:'Administrator', department_head:'Department head', user:'Employee' }[role] || role || '';
}
function esc(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function iconLayers()   { return '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'; }
function iconDashboard(){ return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'; }
function iconFiles()    { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>'; }
function iconUsers()    { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'; }
function iconTags()     { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'; }
function iconShield()   { return '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'; }
function iconLogout()   { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'; }

export { injectSidebar, closeSidebar };
