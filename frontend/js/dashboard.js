import { dashboard, categories } from './mockApi.js';
import { requireAuth, fileSize, isAdmin } from './auth.js';

const user = requireAuth();
if (user) load();

async function load() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const [dashRes, catRes] = await Promise.all([dashboard.get(), categories.list()]);

  if (!dashRes.success) { main.innerHTML = `<div class="error-banner">Failed to load dashboard.</div>`; return; }
  const d = dashRes.data;

  const deptCards = (d.departments || []).map((dep, i) => `
    <a href="./documents.html" class="department-card">
      <span class="folder-tile folder-${i % 4}">
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      </span>
      <svg class="department-arrow" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
      <h3>${esc(dep.name)}</h3>
      <p>${dep.count} document${dep.count !== 1 ? 's' : ''}</p>
    </a>`).join('');

  const recentRows = (d.recentDocuments || []).map(doc => `
    <tr>
      <td><span class="doc-name">${fileIcon(doc.filename)} ${esc(doc.title)}</span></td>
      <td>${esc(doc.category?.name)}</td>
      <td>${esc(doc.uploadedBy?.name)}</td>
      <td>${new Date(doc.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
    </tr>`).join('');

  main.innerHTML = `
    <div class="page-heading">
      <div>
        <div class="eyebrow">YOUR WORKSPACE, AT A GLANCE</div>
        <h1>Good to see you, ${esc(user.name.split(' ')[0])}<span class="greeting-dot">.</span></h1>
        <p>Everything your team needs, right where it belongs.</p>
      </div>
      <a href="./documents.html" class="button primary">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Upload document
      </a>
    </div>

    <section class="stats-grid">
      ${stat('Total documents', d.documentCount, '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>', 'Organized and accessible', 0)}
      ${stat('Departments',     d.departments?.length ?? 0, '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',                                       'Connected in one workspace', 1)}
      ${stat('Categories',      catRes.data?.length ?? 0,   '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>',     'A place for every file', 2)}
      ${stat('Storage used',    fileSize(d.storageBytes),    '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>', 'Across your visible documents', 3)}
    </section>

    <section class="welcome-banner">
      <div class="banner-copy">
        <span class="eyebrow">A CLEARER WAY TO WORK</span>
        <h2>Less clutter.<br />More clarity.</h2>
        <p>Bring your team's documents together.<br />Find what matters, and get back to doing.</p>
        <a href="./documents.html">Explore your documents →</a>
      </div>
      <div class="paper-scene" aria-hidden="true">
        <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
        <span class="scene-spark spark-one">✦</span><span class="scene-spark spark-two">+</span>
        <div class="paper paper-back"></div>
        <div class="paper paper-front">
          <div class="paper-line dark"></div><div class="paper-line"></div>
          <div class="paper-line short"></div>
          <span class="paper-chip">All in one place <span>✓</span></span>
          <div class="paper-line"></div><div class="paper-line short"></div>
        </div>
        <span class="floating-check">✓</span>
        <span class="floating-label">Made for teamwork</span>
      </div>
    </section>

    ${deptCards ? `
    <section class="section-block">
      <div class="section-title">
        <div><h2>Browse by department</h2><p>A shared space for every team.</p></div>
        <a href="./documents.html" class="text-link">View all documents ↗</a>
      </div>
      <div class="department-grid">${deptCards}</div>
    </section>` : ''}

    <section class="panel recent-panel">
      <div class="panel-heading">
        <div><h2>Recently added</h2><p>The latest additions to your workspace.</p></div>
        <a href="./documents.html" class="text-link">View all →</a>
      </div>
      ${recentRows ? `<table class="doc-table">
        <thead><tr><th>Title</th><th>Category</th><th>Uploaded by</th><th>Date</th></tr></thead>
        <tbody>${recentRows}</tbody>
      </table>` : '<div class="empty-state"><p>No documents yet.</p></div>'}
    </section>`;
}

function stat(label, value, iconPath, note, idx) {
  return `<div class="stat-card">
    <div class="stat-top"><span>${label}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconPath}</svg></div>
    <strong>${esc(String(value))}</strong>
    <small><span class="stat-pip pip-${idx}"></span>${note}</small>
  </div>`;
}

function fileIcon(name) {
  const ext = (name || '').split('.').pop().toLowerCase();
  if (ext === 'pdf') return '📄';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['jpg','jpeg','png'].includes(ext)) return '🖼️';
  return '📎';
}

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
