const {
  createDocument,
  getDocuments,
  renameDocument,
  deleteDocument,
  getDownloadUrl,
} = require('../services/documentService');

/** POST /api/documents/upload */
async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const { category_id } = req.body;
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'category_id is required.' });
    }
    const doc = await createDocument(
      req.file.originalname,
      req.file.key,          // S3 key injected by multer-s3
      category_id,
      req.session.userId
    );
    return res.status(201).json({ success: true, message: 'File uploaded successfully.', document: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** GET /api/documents  ?search=&category_id= */
async function listDocuments(req, res) {
  try {
    const { search, category_id } = req.query;
    const docs = await getDocuments({
      role: req.session.role,
      userId: req.session.userId,
      search: search || '',
      categoryId: category_id || null,
    });
    return res.json({ success: true, documents: docs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** PATCH /api/documents/:id/rename */
async function renameDoc(req, res) {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'filename is required.' });
    }
    const doc = await renameDocument(
      req.params.id,
      filename.trim(),
      req.session.userId,
      req.session.role
    );
    return res.json({ success: true, message: 'Document renamed.', document: doc });
  } catch (err) {
    return res.status(err.message === 'Access denied.' ? 403 : 404).json({
      success: false,
      message: err.message,
    });
  }
}

/** DELETE /api/documents/:id */
async function deleteDoc(req, res) {
  try {
    await deleteDocument(req.params.id, req.session.userId, req.session.role);
    return res.json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    return res.status(err.message === 'Access denied.' ? 403 : 404).json({
      success: false,
      message: err.message,
    });
  }
}

/** GET /api/documents/:id/download */
async function downloadDoc(req, res) {
  try {
    const { url, filename } = await getDownloadUrl(
      req.params.id,
      req.session.userId,
      req.session.role
    );
    return res.json({ success: true, url, filename });
  } catch (err) {
    return res.status(err.message === 'Access denied.' ? 403 : 404).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = { uploadDocument, listDocuments, renameDoc, deleteDoc, downloadDoc };
