-- ============================================================
-- Docket Document Management System
-- Script 04: Sample CRUD queries used in the application
-- ============================================================

USE docket_db;

-- SELECT: list all documents with category and uploader names
SELECT
  d.id,
  d.filename,
  d.s3_key,
  d.upload_date,
  c.category_name,
  u.name AS uploaded_by_name
FROM documents d
JOIN categories c ON d.category_id = c.id
JOIN users      u ON d.uploaded_by  = u.id
ORDER BY d.upload_date DESC;

-- SELECT: search documents by filename
SELECT d.id, d.filename, c.category_name, u.name AS uploaded_by_name
FROM documents d
JOIN categories c ON d.category_id = c.id
JOIN users      u ON d.uploaded_by  = u.id
WHERE d.filename LIKE '%report%'
ORDER BY d.upload_date DESC;

-- SELECT: filter documents by category for a specific user
SELECT d.id, d.filename, d.upload_date
FROM documents d
WHERE d.category_id = 1
  AND d.uploaded_by = 2;

-- INSERT: add a new document record
INSERT INTO documents (filename, s3_key, category_id, uploaded_by)
VALUES ('Q3_Report.pdf', 'uploads/2/1700000000000-abc123.pdf', 2, 2);

-- UPDATE: rename a document
UPDATE documents SET filename = 'Q3_Financial_Report_2026.pdf' WHERE id = 1;

-- DELETE: remove a document record
DELETE FROM documents WHERE id = 1;

-- SELECT: all users (admin view)
SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC;

-- UPDATE: change a user's role
UPDATE users SET role = 'admin' WHERE id = 3;

-- DELETE: remove a user
DELETE FROM users WHERE id = 5;
