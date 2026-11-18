const pool = require('../config/db');
const deleteS3Object = require('../utils/deleteS3Object');
const getPresignedUrl = require('../utils/presignedUrl');

/**
 * Saves document metadata to the database after a successful S3 upload.
 */
async function createDocument(filename, s3Key, categoryId, uploadedBy) {
  const [result] = await pool.query(
    `INSERT INTO documents (filename, s3_key, category_id, uploaded_by)
     VALUES (?, ?, ?, ?)`,
    [filename, s3Key, categoryId, uploadedBy]
  );
  return { id: result.insertId, filename, s3Key, categoryId, uploadedBy };
}

/**
 * Returns documents the requesting user is allowed to see.
 * Admins see all documents; regular users see only their own.
 * Supports optional search and category filter.
 */
async function getDocuments({ role, userId, search = '', categoryId = null }) {
  let sql = `
    SELECT d.id, d.filename, d.s3_key, d.upload_date,
           c.category_name, u.name AS uploaded_by_name
    FROM documents d
    JOIN categories c ON d.category_id = c.id
    JOIN users u ON d.uploaded_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (role !== 'admin') {
    sql += ' AND d.uploaded_by = ?';
    params.push(userId);
  }
  if (search) {
    sql += ' AND d.filename LIKE ?';
    params.push(`%${search}%`);
  }
  if (categoryId) {
    sql += ' AND d.category_id = ?';
    params.push(categoryId);
  }
  sql += ' ORDER BY d.upload_date DESC';

  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Returns a single document record by ID.
 * Enforces ownership for non-admins.
 */
async function getDocumentById(docId, userId, role) {
  const [rows] = await pool.query(
    `SELECT d.*, c.category_name, u.name AS uploaded_by_name
     FROM documents d
     JOIN categories c ON d.category_id = c.id
     JOIN users u ON d.uploaded_by = u.id
     WHERE d.id = ?`,
    [docId]
  );
  if (rows.length === 0) throw new Error('Document not found.');
  const doc = rows[0];
  if (role !== 'admin' && doc.uploaded_by !== userId) {
    throw new Error('Access denied.');
  }
  return doc;
}

/**
 * Renames a document (updates the display filename only, not the S3 key).
 * Enforces ownership for non-admins.
 */
async function renameDocument(docId, newFilename, userId, role) {
  const doc = await getDocumentById(docId, userId, role);
  await pool.query('UPDATE documents SET filename = ? WHERE id = ?', [newFilename, doc.id]);
  return { ...doc, filename: newFilename };
}

/**
 * Deletes a document from both S3 and the database.
 * Enforces ownership for non-admins.
 */
async function deleteDocument(docId, userId, role) {
  const doc = await getDocumentById(docId, userId, role);
  await deleteS3Object(doc.s3_key);
  await pool.query('DELETE FROM documents WHERE id = ?', [doc.id]);
}

/**
 * Generates a temporary pre-signed download URL for a document.
 * Enforces ownership for non-admins.
 */
async function getDownloadUrl(docId, userId, role) {
  const doc = await getDocumentById(docId, userId, role);
  const url = await getPresignedUrl(doc.s3_key);
  return { url, filename: doc.filename };
}

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  renameDocument,
  deleteDocument,
  getDownloadUrl,
};
