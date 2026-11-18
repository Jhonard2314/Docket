/**
 * api.js — Thin wrapper around the Fetch API.
 * All backend calls go through these helpers so the base URL is in one place.
 */

const BASE = '/api';

/**
 * Makes a JSON API request.
 * @param {string} path   - e.g. '/auth/login'
 * @param {object} options - fetch options (method, body, etc.)
 * @returns {Promise<object>} parsed JSON response
 */
async function request(path, options = {}) {
  const defaults = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  const merged = {
    ...defaults,
    ...options,
    headers: { ...defaults.headers, ...(options.headers || {}) },
  };
  if (merged.body && typeof merged.body === 'object' && !(merged.body instanceof FormData)) {
    merged.body = JSON.stringify(merged.body);
  }
  if (merged.body instanceof FormData) {
    // Let the browser set multipart headers automatically
    delete merged.headers['Content-Type'];
  }
  const res = await fetch(`${BASE}${path}`, merged);
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
const auth = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
};

// ── Categories ────────────────────────────────────────────────────────────────
const categories = {
  list: () => request('/categories'),
  create: (data) => request('/categories', { method: 'POST', body: data }),
  remove: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// ── Documents ─────────────────────────────────────────────────────────────────
const documents = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/documents${qs ? '?' + qs : ''}`);
  },
  upload: (formData) => request('/documents/upload', { method: 'POST', body: formData }),
  rename: (id, filename) => request(`/documents/${id}/rename`, { method: 'PATCH', body: { filename } }),
  remove: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  download: (id) => request(`/documents/${id}/download`),
};

// ── Users (admin) ─────────────────────────────────────────────────────────────
const users = {
  list: () => request('/users'),
  changeRole: (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

export { auth, categories, documents, users };
