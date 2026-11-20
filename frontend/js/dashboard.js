import { documents, categories, users } from './mockApi.js';
import { requireAuth } from './auth.js';

const user = requireAuth();
if (user) loadDashboard();

async function loadDashboard() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const [docsRes, catsRes, usersRes] = await Promise.all([
    documents.list(), categories.list(), users.list()
  ]);

  const docCount  = docsRes.success  ? docsRes.documents.length  : 0;
  const catCount  = catsRes.success  ? catsRes.categories.length : 0;
  const userCount = usersRes.success ? usersRes.users.length     : 0;

  // Group documents by category for department cards
  const byCategory = {};
  if (docsRes.success) {
    docsRes.documents.forEach(d => {
      if (!byCategory[d.category_name]) byCategory[d.category_name] = 0;
      byCategory[d.category_name]++;
    });
  }

  const departmentCards = Object.entries(byCategory).map(([name, count], i) => `
    <a href="./documents.html" class="department-card">
      <span class="folder-tile folder-${i % 4}">
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      </span>
      <svg class="department-arrow" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
      <h3>${esc(name)}</h3>
      <p>${count} document${count !== 1 ? 's' : ''}</p>
    </a>`).join('');

  const recentRows = docsRes.success ? docsRes.documents.slice(0, 5).map(d => `
    <tr>
      <td><span class="doc-name">${fileIcon(d.filename)} ${esc(d.filename)}</span></td>
      <td>${esc(d.category_name)}</td>
      <td>${esc(d.uploaded_by_name)}</td>
      <td>${new Date(d.upload_date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
    </tr>`).join('') : '';

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

    <section class="stats-grid" aria-label="Workspace statistics">
      ${statCard('Total documents', docCount, iconFiles(), 'Organized and accessible', 0)}
      ${statCard('Categories', catCount, iconTags(), 'A place for every file', 1)}
      ${statCard('Team members', userCount, iconUsers(), 'Connected in one workspace', 2)}
      ${statCard('Your role', roleLabel(user.role), iconShield(), 'Access level in this workspace', 3)}
    </section>

    <section class="welcome-banner">
      <div class="banner-copy">
        <span class="eyebrow">A CLEARER WAY TO WORK</span>
        <h2>Less clutter.<br />More clarity.</h2>
        <p>Bring your team's documents together.<br />Find what matters, and get back to doing.</p>
        <a href="./documents.html">Explore your documents →</a>
      </div>
      <div class="paper-scene" aria-hidden="true">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <span class="scene-spark spark-one">✦</span>
        <span class="scene-spark spark-two">+</span>
        <div class="paper paper-back"></div>
        <div class="paper paper-front">
          <span class="paper-logo">${iconFiles()}</span>
          <div class="paper-line dark"></div>
          <div class="paper-line"></div>
          <div class="paper-line short"></div>
          <span class="paper-chip">All in one place <span>✓</span></span>
          <div class="paper-line"></div>
          <div class="paper-line short"></div>
        </div>
        <span class="floating-check">✓</span>
        <span class="floating-label">${iconFolder()} Made for teamwork</span>
      </div>
    </section>

    ${Object.keys(byCategory).length ? `
    <section class="section-block">
      <div class="section-title">
        <div>
          <h2>Browse by department</h2>
          <p>A shared space for every team.</p>
        </div>
        <a href="./documents.html" class="text-link">View all documents ↗</a>
      </div>
      <div class="department-grid">${departmentCards}</div>
    </section>` : ''}

    <section class="panel recent-panel">
      <div class="panel-heading">
        <div><h2>Recently added</h2><p>The latest additions to your workspace.</p></div>
        <a href="./documents.html" class="text-link">View all →</a>
      </div>
      ${recentRows ? `
      <table class="doc-table">
        <thead><tr><th>Name</th><th>Category</th><th>Uploaded by</th><th>Date</th></tr></thead>
        <tbody>${recentRows}</tbody>
      </table>` : '<div class="empty-state"><p>No documents yet.</p></div>'}
    </section>`;
}

function statCard(label, value, icon, note, idx) {
  return `
    <div class="stat-card">
      <div class="stat-top"><span>${label}</span>${icon}</div>
      <strong>${esc(String(value))}</strong>
      <small><span class="stat-pip pip-${idx}"></span>${note}</small>
    </div>`;
}

function roleLabel(r) {
  return { admin:'Administrator', department_head:'Department head', user:'Employee' }[r] || r || '';
}

function fileIcon(name) {
  const ext = (name||'').split('.').pop().toLowerCase();
  if (ext==='pdf') return '📄';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['jpg','jpeg','png','gif'].includes(ext)) return '🖼️';
  return '📎';
}

function iconFiles()  { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>'; }
function iconTags()   { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'; }
function iconUsers()  { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>'; }
function iconShield() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'; }
function iconFolder() { return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'; }
function esc(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
