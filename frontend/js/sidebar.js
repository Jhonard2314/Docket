/**
 * sidebar.js — Injects the shared sidebar HTML and marks the active link.
 * Import this module on every protected page BEFORE other page scripts.
 */

const SIDEBAR_HTML = `
<aside class="sidebar">
  <div class="brand"><i class="bi bi-folder2-open me-2"></i>Docket</div>
  <nav class="mt-2">
    <a href="dashboard.html"  data-page="dashboard">
      <i class="bi bi-speedometer2"></i> Dashboard
    </a>
    <a href="documents.html"  data-page="documents">
      <i class="bi bi-file-earmark-text"></i> Documents
    </a>
    <a href="categories.html" data-page="categories">
      <i class="bi bi-tags"></i> Categories
    </a>
    <a href="users.html" data-page="users" class="admin-only d-none">
      <i class="bi bi-people"></i> Users
    </a>
  </nav>
  <div class="mt-auto p-3 border-top border-secondary" style="margin-top:auto">
    <div class="small text-secondary mb-1">
      <i class="bi bi-person-circle me-1"></i>
      <span data-user-name>—</span>
      <span class="badge bg-secondary ms-1" data-user-role></span>
    </div>
    <button id="logout-btn" class="btn btn-sm btn-outline-danger w-100 mt-1">
      <i class="bi bi-box-arrow-right me-1"></i>Logout
    </button>
  </div>
</aside>`;

function injectSidebar() {
  const wrapper = document.getElementById('app');
  if (!wrapper) return;

  // Insert sidebar before first child
  const temp = document.createElement('div');
  temp.innerHTML = SIDEBAR_HTML.trim();
  wrapper.insertBefore(temp.firstChild, wrapper.firstChild);

  // Mark active page
  const page = document.body.dataset.page;
  document.querySelectorAll('.sidebar nav a').forEach((a) => {
    if (a.dataset.page === page) a.classList.add('active');
  });
}

export { injectSidebar };
