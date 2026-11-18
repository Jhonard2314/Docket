/**
 * api.js — Fetch wrapper for the real backend.
 * Better Auth exposes /api/auth/* automatically.
 * Our app routes use /api/categories, /api/documents, /api/users.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const defaults = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };
  const merged = { ...defaults, ...options, headers: { ...defaults.headers, ...(options.headers || {}) } };

  if (merged.body instanceof FormData) {
    delete merged.headers['Content-Type'];
  } else if (merged.body && typeof merged.body === 'object') {
    merged.body = JSON.stringify(merged.body);
  }

  const res = await fetch(`${BASE}${path}`, merged);
  return res.json();
}

// ── Auth — Better Auth email/password endpoints ───────────────────────────────
const auth = {
  register: (data) => request('/auth/sign-up/email', { method: 'POST', body: data }),
  login:    (data) => request('/auth/sign-in/email', { method: 'POST', body: data }),
  logout:   ()     => request('/auth/sign-out',       { method: 'POST' }),
  me:       ()     => request('/auth/get-session'),
};

// ── Categories ────────────────────────────────────────────────────────────────
const categories = {
  list:   ()     => request('/categories'),
  create: (data) => request('/categories',      { method: 'POST',   body: data }),
  remove: (id)   => request(`/categories/${id}`, { method: 'DELETE' }),
};

// ── Documents ─────────────────────────────────────────────────────────────────
const documents = {
  list:     (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/documents${qs ? '?' + qs : ''}`); },
  upload:   (formData)    => request('/documents/upload',       { method: 'POST',   body: formData }),
  rename:   (id, filename) => request(`/documents/${id}/rename`, { method: 'PATCH',  body: { filename } }),
  remove:   (id)           => request(`/documents/${id}`,        { method: 'DELETE' }),
  download: (id)           => request(`/documents/${id}/download`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
const users = {
  list:       ()          => request('/users'),
  changeRole: (id, role)  => request(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
  remove:     (id)        => request(`/users/${id}`,       { method: 'DELETE' }),
};

export { auth, categories, documents, users };
