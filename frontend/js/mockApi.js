/**
 * mockApi.js — In-memory mock backend for local preview.
 *
 * Field names and role strings EXACTLY match the real API contract so the
 * same frontend code works in both mock and live modes with no changes.
 *
 * Roles: 'ADMIN' | 'DEPARTMENT_HEAD' | 'EMPLOYEE'  (uppercase, matches Prisma enum)
 * Document fields: title, filename, category{id,name}, department{id,name},
 *                  uploadedBy{id,name}, createdAt, sizeBytes, mimeType, status
 */

function delay(ms = 280) { return new Promise(r => setTimeout(r, ms)); }

// ── Seed data ─────────────────────────────────────────────────────────────────

let _session = null;

const _departments = [
  { id: 'dept-hr',    name: 'Human Resources' },
  { id: 'dept-fin',   name: 'Finance' },
  { id: 'dept-legal', name: 'Legal' },
  { id: 'dept-ops',   name: 'Operations' },
  { id: 'dept-it',    name: 'IT & Technology' },
  { id: 'dept-mkt',   name: 'Marketing' },
];

const _categories = [
  { id: 'cat-pol', name: 'Policy' },
  { id: 'cat-rep', name: 'Report' },
  { id: 'cat-con', name: 'Contract' },
  { id: 'cat-mem', name: 'Memo' },
  { id: 'cat-prs', name: 'Presentation' },
  { id: 'cat-inv', name: 'Invoice' },
  { id: 'cat-man', name: 'Manual' },
  { id: 'cat-oth', name: 'Other' },
];

const _users = [
  { id: 'u1', name: 'System Admin',    email: 'admin@docket.local',    role: 'ADMIN',           departmentId: null,       isActive: true, createdAt: '2026-01-10T08:00:00Z', department: null },
  { id: 'u2', name: 'Jamie Santos',    email: 'head@docket.local',     role: 'DEPARTMENT_HEAD', departmentId: 'dept-hr',  isActive: true, createdAt: '2026-02-14T09:30:00Z', department: { id: 'dept-hr', name: 'Human Resources' } },
  { id: 'u3', name: 'Sam Reyes',       email: 'employee@docket.local', role: 'EMPLOYEE',        departmentId: 'dept-hr',  isActive: true, createdAt: '2026-03-01T11:00:00Z', department: { id: 'dept-hr', name: 'Human Resources' } },
  { id: 'u4', name: 'Alex Morgan',     email: 'alex@docket.local',     role: 'DEPARTMENT_HEAD', departmentId: 'dept-fin', isActive: true, createdAt: '2026-04-01T10:00:00Z', department: { id: 'dept-fin', name: 'Finance' } },
];

let _documents = [
  { id: 'd1', title: 'Q3 Financial Report 2026', description: 'Third-quarter summary.', filename: 'Q3_Financial_Report_2026.pdf', mimeType: 'application/pdf', sizeBytes: 204800, status: 'READY', createdAt: '2026-10-05T10:00:00Z', updatedAt: '2026-10-05T10:00:00Z', category: { id: 'cat-rep', name: 'Report' }, department: { id: 'dept-fin', name: 'Finance' }, uploadedBy: { id: 'u1', name: 'System Admin' }, permissions: { canEdit: true, canDelete: true, canDownload: true } },
  { id: 'd2', title: 'Employee Handbook v2',      description: null,                      filename: 'Employee_Handbook_v2.docx',   mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes: 98304,  status: 'READY', createdAt: '2026-10-10T14:00:00Z', updatedAt: '2026-10-10T14:00:00Z', category: { id: 'cat-man', name: 'Manual' },   department: { id: 'dept-hr',  name: 'Human Resources' }, uploadedBy: { id: 'u2', name: 'Jamie Santos' }, permissions: { canEdit: true, canDelete: true, canDownload: true } },
  { id: 'd3', title: 'Service Agreement 2026',    description: 'Annual vendor contract.', filename: 'Service_Agreement_2026.pdf',  mimeType: 'application/pdf', sizeBytes: 55000,  status: 'READY', createdAt: '2026-11-01T09:00:00Z', updatedAt: '2026-11-01T09:00:00Z', category: { id: 'cat-con', name: 'Contract' }, department: { id: 'dept-legal', name: 'Legal' },  uploadedBy: { id: 'u3', name: 'Sam Reyes'   }, permissions: { canEdit: false, canDelete: false, canDownload: true } },
  { id: 'd4', title: 'Server Setup Guide',         description: null,                      filename: 'Server_Setup_Guide.pdf',      mimeType: 'application/pdf', sizeBytes: 32768,  status: 'READY', createdAt: '2026-11-10T16:00:00Z', updatedAt: '2026-11-10T16:00:00Z', category: { id: 'cat-man', name: 'Manual' },   department: { id: 'dept-it',  name: 'IT & Technology' }, uploadedBy: { id: 'u3', name: 'Sam Reyes'   }, permissions: { canEdit: false, canDelete: false, canDownload: true } },
  { id: 'd5', title: 'Q4 Marketing Plan',          description: 'Campaign roadmap.',       filename: 'Q4_Marketing_Plan.pdf',        mimeType: 'application/pdf', sizeBytes: 71680,  status: 'READY', createdAt: '2026-11-15T11:00:00Z', updatedAt: '2026-11-15T11:00:00Z', category: { id: 'cat-prs', name: 'Presentation' }, department: { id: 'dept-mkt', name: 'Marketing' }, uploadedBy: { id: 'u4', name: 'Alex Morgan'  }, permissions: { canEdit: false, canDelete: false, canDownload: true } },
];

let _nextId = 6;

// ── Auth ──────────────────────────────────────────────────────────────────────
const auth = {
  async login({ email }) {
    await delay();
    const user = _users.find(u => u.email === email);
    if (!user) return { success: false, message: 'Invalid email or password.' };
    _session = { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId, isActive: true };
    return { success: true, data: { user: _session } };
  },
  async logout() { await delay(80); _session = null; return { success: true }; },
  async me()     { await delay(80); if (!_session) return { success: false }; return { success: true, data: _session }; },
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const dashboard = {
  async get() {
    await delay();
    if (!_session) return { success: false };
    const visible = _session.role === 'ADMIN'
      ? _documents.filter(d => d.status === 'READY')
      : _documents.filter(d => d.status === 'READY' && d.department.id === _session.departmentId);
    const storageBytes = visible.reduce((s, d) => s + d.sizeBytes, 0);

    // Count by department
    const deptMap = {};
    visible.forEach(d => { deptMap[d.department.id] = deptMap[d.department.id] || { ...d.department, count: 0 }; deptMap[d.department.id].count++; });

    return {
      success: true,
      data: {
        documentCount:   visible.length,
        storageBytes,
        recentDocuments: visible.slice(0, 5),
        departments:     Object.values(deptMap),
        categoryCount:   _categories.length,
      },
    };
  },
};

// ── Documents ─────────────────────────────────────────────────────────────────
const documents = {
  async list({ q = '', categoryId = '', departmentId = '', sort = 'newest', page = 1, pageSize = 20 } = {}) {
    await delay();
    let docs = _session?.role === 'ADMIN'
      ? _documents.filter(d => d.status === 'READY')
      : _documents.filter(d => d.status === 'READY' && d.department.id === _session?.departmentId);
    if (q)           docs = docs.filter(d => d.title.toLowerCase().includes(q.toLowerCase()) || d.filename.toLowerCase().includes(q.toLowerCase()));
    if (categoryId)  docs = docs.filter(d => d.category.id === categoryId);
    if (departmentId && _session?.role === 'ADMIN') docs = docs.filter(d => d.department.id === departmentId);
    const total = docs.length;
    const start = (Number(page) - 1) * Number(pageSize);
    return { success: true, data: docs.slice(start, start + Number(pageSize)), pagination: { page: Number(page), pageSize: Number(pageSize), total, totalPages: Math.ceil(total / Number(pageSize)) } };
  },
  async get(id) {
    await delay();
    const doc = _documents.find(d => d.id === id);
    if (!doc) return { success: false, message: 'Not found.' };
    return { success: true, data: doc };
  },
  async update(id, { title, description, categoryId }) {
    await delay();
    const doc = _documents.find(d => d.id === id);
    if (!doc) return { success: false, message: 'Not found.' };
    if (title)      doc.title = title;
    if (description !== undefined) doc.description = description;
    if (categoryId) { const cat = _categories.find(c => c.id === categoryId); if (cat) doc.category = cat; }
    return { success: true, data: doc };
  },
  async remove(id) {
    await delay();
    const idx = _documents.findIndex(d => d.id === id);
    if (idx === -1) return { success: true }; // Already gone — 204 behavior
    _documents.splice(idx, 1);
    return { success: true };
  },
  async download(id) {
    await delay();
    const doc = _documents.find(d => d.id === id);
    if (!doc) return { success: false, message: 'Not found.' };
    return { success: true, data: { url: '#mock-download', expiresAt: new Date(Date.now() + 900000).toISOString() } };
  },
  async createUploadIntent({ title, description, categoryId, departmentId, fileName, contentType, sizeBytes }) {
    await delay(400);
    const id = `d${_nextId++}`;
    const cat  = _categories.find(c => c.id === categoryId) || _categories[0];
    const dept = _departments.find(d => d.id === departmentId) || _departments.find(d => d.id === _session?.departmentId) || _departments[0];
    const newDoc = {
      id, title, description: description || null, filename: fileName,
      mimeType: contentType, sizeBytes: Number(sizeBytes), status: 'PENDING',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      category: { id: cat.id, name: cat.name },
      department: { id: dept.id, name: dept.name },
      uploadedBy: { id: _session?.id, name: _session?.name },
      permissions: { canEdit: true, canDelete: true, canDownload: true },
    };
    _documents.push(newDoc);
    return { success: true, data: { uploadId: id, expiresAt: new Date(Date.now() + 300000).toISOString(), upload: { method: 'POST', url: '#mock-s3', fields: {} } } };
  },
  async completeUpload(uploadId) {
    await delay(300);
    const doc = _documents.find(d => d.id === uploadId);
    if (!doc) return { success: false, message: 'Upload not found.' };
    doc.status = 'READY';
    return { success: true, data: doc };
  },
};

// ── Categories ────────────────────────────────────────────────────────────────
const categories = {
  async list() { await delay(); return { success: true, data: [..._categories] }; },
  async create({ name }) {
    await delay();
    if (_categories.find(c => c.name === name)) return { success: false, message: 'Already exists.' };
    const c = { id: 'cat-' + Date.now(), name };
    _categories.push(c);
    return { success: true, data: c };
  },
  async update(id, { name }) {
    await delay();
    const c = _categories.find(c => c.id === id);
    if (!c) return { success: false, message: 'Not found.' };
    c.name = name;
    return { success: true, data: c };
  },
  async remove(id) {
    await delay();
    const idx = _categories.findIndex(c => c.id === id);
    if (idx === -1) return { success: false, message: 'Not found.' };
    _categories.splice(idx, 1);
    return { success: true };
  },
};

// ── Admin: Users ──────────────────────────────────────────────────────────────
const adminUsers = {
  async list() { await delay(); return { success: true, data: [..._users] }; },
  async update(id, data) {
    await delay();
    const u = _users.find(u => u.id === id);
    if (!u) return { success: false, message: 'Not found.' };
    if (data.role)         u.role = data.role;
    if (data.departmentId !== undefined) { u.departmentId = data.departmentId; u.department = _departments.find(d => d.id === data.departmentId) || null; }
    if (data.isActive !== undefined) u.isActive = data.isActive;
    return { success: true, data: u };
  },
  async remove(id) {
    await delay();
    const u = _users.find(u => u.id === id);
    if (u) u.isActive = false;
    return { success: true, data: u };
  },
};

// ── Admin: Departments ────────────────────────────────────────────────────────
const adminDepartments = {
  async list() { await delay(); return { success: true, data: [..._departments] }; },
  async create({ name }) {
    await delay();
    if (_departments.find(d => d.name === name)) return { success: false, message: 'Already exists.' };
    const d = { id: 'dept-' + Date.now(), name };
    _departments.push(d);
    return { success: true, data: d };
  },
  async update(id, { name }) {
    await delay();
    const d = _departments.find(d => d.id === id);
    if (!d) return { success: false, message: 'Not found.' };
    d.name = name;
    return { success: true, data: d };
  },
  async remove(id) {
    await delay();
    const idx = _departments.findIndex(d => d.id === id);
    if (idx === -1) return { success: false, message: 'Not found.' };
    _departments.splice(idx, 1);
    return { success: true };
  },
};

export { auth, dashboard, documents, categories, adminUsers, adminDepartments };
