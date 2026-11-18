/**
 * mockApi.js — Simulates backend responses with in-memory data.
 * Drop-in replacement for api.js during local preview (no server needed).
 */

// ── In-memory store ───────────────────────────────────────────────────────────
let _session = null;

const _users = [
  { id: 1, name: 'System Admin',   email: 'admin@docket.com', role: 'admin', created_at: '2026-01-10T08:00:00Z' },
  { id: 2, name: 'Juan dela Cruz', email: 'juan@docket.com',  role: 'user',  created_at: '2026-02-14T09:30:00Z' },
  { id: 3, name: 'Maria Santos',   email: 'maria@docket.com', role: 'user',  created_at: '2026-03-01T11:00:00Z' },
];

const _categories = [
  { id: 1, category_name: 'Human Resources' },
  { id: 2, category_name: 'Finance' },
  { id: 3, category_name: 'Legal' },
  { id: 4, category_name: 'Operations' },
  { id: 5, category_name: 'IT & Technology' },
  { id: 6, category_name: 'Marketing' },
];

let _documents = [
  { id: 1, filename: 'Q3_Financial_Report_2026.pdf', s3_key: 'uploads/1/mock1.pdf', category_id: 2, category_name: 'Finance',         uploaded_by: 1, uploaded_by_name: 'System Admin',   upload_date: '2026-10-05T10:00:00Z' },
  { id: 2, filename: 'Employee_Handbook_v2.docx',   s3_key: 'uploads/1/mock2.docx',category_id: 1, category_name: 'Human Resources',  uploaded_by: 1, uploaded_by_name: 'System Admin',   upload_date: '2026-10-10T14:00:00Z' },
  { id: 3, filename: 'Service_Agreement_2026.pdf',  s3_key: 'uploads/2/mock3.pdf', category_id: 3, category_name: 'Legal',            uploaded_by: 2, uploaded_by_name: 'Juan dela Cruz', upload_date: '2026-11-01T09:00:00Z' },
  { id: 4, filename: 'Server_Setup_Guide.pdf',      s3_key: 'uploads/2/mock4.pdf', category_id: 5, category_name: 'IT & Technology',  uploaded_by: 2, uploaded_by_name: 'Juan dela Cruz', upload_date: '2026-11-10T16:00:00Z' },
  { id: 5, filename: 'Q4_Marketing_Plan.pptx',      s3_key: 'uploads/3/mock5.pdf', category_id: 6, category_name: 'Marketing',        uploaded_by: 3, uploaded_by_name: 'Maria Santos',   upload_date: '2026-11-15T11:00:00Z' },
];

let _nextDocId = 6;
let _nextCatId = 7;
let _nextUserId = 4;

function delay(ms = 300) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Auth ──────────────────────────────────────────────────────────────────────
const auth = {
  async register({ name, email, password }) {
    await delay();
    if (_users.find(u => u.email === email)) {
      return { success: false, message: 'Email is already registered.' };
    }
    const user = { id: _nextUserId++, name, email, role: 'user', created_at: new Date().toISOString() };
    _users.push(user);
    return { success: true, message: 'Registration successful.', user };
  },
  async login({ email, password }) {
    await delay();
    const user = _users.find(u => u.email === email);
    // Accept any password in mock mode
    if (!user) return { success: false, message: 'Invalid email or password.' };
    _session = { id: user.id, name: user.name, role: user.role };
    return { success: true, message: 'Login successful.', user: _session };
  },
  async logout() {
    await delay(100);
    _session = null;
    return { success: true };
  },
  async me() {
    await delay(100);
    if (!_session) return { success: false, message: 'Not authenticated.' };
    return { success: true, user: _session };
  },
};

// ── Categories ────────────────────────────────────────────────────────────────
const categories = {
  async list() {
    await delay();
    return { success: true, categories: [..._categories] };
  },
  async create({ category_name }) {
    await delay();
    if (_categories.find(c => c.category_name === category_name)) {
      return { success: false, message: 'Category already exists.' };
    }
    const cat = { id: _nextCatId++, category_name };
    _categories.push(cat);
    return { success: true, message: 'Category created.', category: cat };
  },
  async remove(id) {
    await delay();
    const idx = _categories.findIndex(c => c.id === Number(id));
    if (idx === -1) return { success: false, message: 'Not found.' };
    _categories.splice(idx, 1);
    return { success: true, message: 'Category deleted.' };
  },
};

// ── Documents ─────────────────────────────────────────────────────────────────
const documents = {
  async list({ search = '', category_id = '' } = {}) {
    await delay();
    let docs = _session?.role === 'admin'
      ? [..._documents]
      : _documents.filter(d => d.uploaded_by === _session?.id);
    if (search)      docs = docs.filter(d => d.filename.toLowerCase().includes(search.toLowerCase()));
    if (category_id) docs = docs.filter(d => d.category_id === Number(category_id));
    return { success: true, documents: docs.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date)) };
  },
  async upload(formData) {
    await delay(600);
    const file       = formData.get('file');
    const categoryId = Number(formData.get('category_id'));
    const cat        = _categories.find(c => c.id === categoryId);
    const doc = {
      id: _nextDocId++,
      filename: file.name,
      s3_key: `uploads/${_session?.id}/mock_${Date.now()}.${file.name.split('.').pop()}`,
      category_id: categoryId,
      category_name: cat?.category_name || 'Unknown',
      uploaded_by: _session?.id,
      uploaded_by_name: _session?.name,
      upload_date: new Date().toISOString(),
    };
    _documents.push(doc);
    return { success: true, message: 'File uploaded successfully.', document: doc };
  },
  async rename(id, filename) {
    await delay();
    const doc = _documents.find(d => d.id === Number(id));
    if (!doc) return { success: false, message: 'Not found.' };
    doc.filename = filename;
    return { success: true, message: 'Document renamed.', document: doc };
  },
  async remove(id) {
    await delay();
    const idx = _documents.findIndex(d => d.id === Number(id));
    if (idx === -1) return { success: false, message: 'Not found.' };
    _documents.splice(idx, 1);
    return { success: true, message: 'Document deleted.' };
  },
  async download(id) {
    await delay();
    const doc = _documents.find(d => d.id === Number(id));
    if (!doc) return { success: false, message: 'Not found.' };
    return { success: true, url: '#mock-download', filename: doc.filename };
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────
const users = {
  async list() {
    await delay();
    return { success: true, users: [..._users] };
  },
  async changeRole(id, role) {
    await delay();
    const user = _users.find(u => u.id === Number(id));
    if (!user) return { success: false, message: 'Not found.' };
    user.role = role;
    return { success: true, message: 'Role updated.', user };
  },
  async remove(id) {
    await delay();
    const idx = _users.findIndex(u => u.id === Number(id));
    if (idx === -1) return { success: false, message: 'Not found.' };
    _users.splice(idx, 1);
    return { success: true, message: 'User deleted.' };
  },
};

export { auth, categories, documents, users };
