/**
 * auth.js — Session helpers.
 * Reads from localStorage (mock mode) or /api/me (live mode).
 * Roles are uppercase: 'ADMIN' | 'DEPARTMENT_HEAD' | 'EMPLOYEE'
 */

export function getUser() {
  try { return JSON.parse(localStorage.getItem('docket_user')); }
  catch { return null; }
}

export function requireAuth() {
  const user = getUser();
  if (!user) { window.location.href = 'login.html'; return null; }
  return user;
}

export function isAdmin()      { return getUser()?.role === 'ADMIN'; }
export function isDeptHead()   { return getUser()?.role === 'DEPARTMENT_HEAD'; }

export function fileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0; let v = bytes;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v % 1 === 0 ? v : v.toFixed(1)} ${units[i]}`;
}
