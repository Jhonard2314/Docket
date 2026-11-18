-- ============================================================
-- Docket Document Management System
-- Script 04: Sample CRUD queries (PostgreSQL)
-- ============================================================

\c docket_db;

-- SELECT: all documents with category and uploader
SELECT d.id, d.filename, d."s3Key", d."createdAt",
       c.name AS category_name,
       u.name AS uploaded_by
FROM documents d
JOIN categories c ON d."categoryId" = c.id
JOIN users      u ON d."uploadedById" = u.id
ORDER BY d."createdAt" DESC;

-- SELECT: search documents by filename (case-insensitive)
SELECT d.id, d.filename, c.name AS category_name
FROM documents d
JOIN categories c ON d."categoryId" = c.id
WHERE d.filename ILIKE '%report%'
ORDER BY d."createdAt" DESC;

-- SELECT: documents in a specific category for a specific user
SELECT d.id, d.filename, d."createdAt"
FROM documents d
WHERE d."categoryId" = 'some-category-id'
  AND d."uploadedById" = 'some-user-id';

-- INSERT: new document record (metadata only; file is in S3)
INSERT INTO documents (id, filename, "s3Key", "mimeType", "sizeBytes", "categoryId", "uploadedById")
VALUES (
  gen_random_uuid()::text,
  'Q3_Report_2026.pdf',
  'uploads/user123/1700000000-abc12345.pdf',
  'application/pdf',
  204800,
  'some-category-id',
  'some-user-id'
);

-- UPDATE: rename a document
UPDATE documents SET filename = 'Q3_Financial_Report_2026.pdf', "updatedAt" = NOW()
WHERE id = 'some-document-id';

-- DELETE: remove a document record
DELETE FROM documents WHERE id = 'some-document-id';

-- SELECT: all users (admin view)
SELECT id, name, email, role, "createdAt" FROM users ORDER BY "createdAt" DESC;

-- UPDATE: promote a user to admin
UPDATE users SET role = 'ADMIN', "updatedAt" = NOW() WHERE id = 'some-user-id';

-- DELETE: remove a user
DELETE FROM users WHERE id = 'some-user-id';
