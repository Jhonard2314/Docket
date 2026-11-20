/**
 * api.js — Real backend fetch wrapper.
 * Matches the API contract in API_CONTRACT.md exactly.
 * All pages import from this file when connected to the live backend.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const defaults = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };
  const merged   = { ...defaults, ...options, headers: { ...defaults.headers, ...(options.headers || {}) } };

  if (merged.body instanceof FormData) {
    delete merged.headers['Content-Type'];
  } else if (merged.body && typeof merged.body === 'object') {
    merged.body = JSON.stringify(merged.body);
  }

  const res = await fetch(`${BASE}${path}`, merged);

  if (res.status === 204) return { success: true };

  const json = await res.json().catch(() => ({ error: { code: 'PARSE_ERROR', message: 'Invalid response.' } }));

  // Normalise to { success, ...payload } so pages have a consistent check
  if (!res.ok) return { success: false, message: json?.error?.message ?? 'Request failed.', ...json };
  return { success: true, ...json };
}

// ── Auth — Better Auth email/password ──────────────────────────────────────
const auth = {
  login:   (data) => request('/auth/sign-in/email', { method: 'POST', body: data }),
  logout:  ()     => request('/auth/sign-out',       { method: 'POST' }),
  me:      ()     => request('/me'),                            // GET /api/me
};

// ── Dashboard ──────────────────────────────────────────────────────────────
const dashboard = {
  get: () => request('/dashboard'),
};

// ── Documents ──────────────────────────────────────────────────────────────
const documents = {
  list:     (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return request(`/documents${qs ? '?' + qs : ''}`);
  },
  get:      (id)                 => request(`/documents/${id}`),
  update:   (id, data)           => request(`/documents/${id}`,           { method: 'PATCH',  body: data }),
  remove:   (id)                 => request(`/documents/${id}`,           { method: 'DELETE' }),
  download: (id)                 => request(`/documents/${id}/download`),
  createUploadIntent: (data)     => request('/documents/uploads',          { method: 'POST', body: data }),
  completeUpload:     (uploadId) => request(`/documents/uploads/${uploadId}/complete`, { method: 'POST' }),
};

// ── Categories ─────────────────────────────────────────────────────────────
const categories = {
  list:   (q)       => request(`/categories${q ? '?q=' + encodeURIComponent(q) : ''}`),
  create: (data)    => request('/admin/categories',      { method: 'POST',   body: data }),
  update: (id, data)=> request(`/admin/categories/${id}`, { method: 'PATCH',  body: data }),
  remove: (id)      => request(`/admin/categories/${id}`, { method: 'DELETE' }),
};

// ── Admin: Users ───────────────────────────────────────────────────────────
const adminUsers = {
  list:   (q)         => request(`/admin/users${q ? '?q=' + encodeURIComponent(q) : ''}`),
  update: (id, data)  => request(`/admin/users/${id}`, { method: 'PATCH',  body: data }),
  remove: (id)        => request(`/admin/users/${id}`, { method: 'DELETE' }),
};

// ── Admin: Departments ─────────────────────────────────────────────────────
const adminDepartments = {
  list:   (q)       => request(`/admin/departments${q ? '?q=' + encodeURIComponent(q) : ''}`),
  create: (data)    => request('/admin/departments',       { method: 'POST',   body: data }),
  update: (id, data)=> request(`/admin/departments/${id}`, { method: 'PATCH',  body: data }),
  remove: (id)      => request(`/admin/departments/${id}`, { method: 'DELETE' }),
};

export { auth, dashboard, documents, categories, adminUsers, adminDepartments };
