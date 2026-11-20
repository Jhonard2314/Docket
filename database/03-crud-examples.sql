-- ============================================================
-- Docket — Script 03: CRUD examples
-- These demonstrate the SQL operations used by the application.
-- ============================================================

\c docket_db;

-- ── CREATE ────────────────────────────────────────────────────────────────────

-- Insert a document record (after S3 upload is confirmed)
INSERT INTO documents (
  id, title, description, filename,
  "s3Key", "stagingKey", "mimeType", "sizeBytes",
  status, "categoryId", "departmentId", "uploadedById"
) VALUES (
  'doc-example-001',
  'Q3 Financial Report 2026',
  'Third-quarter financial summary for the Finance department.',
  'Q3_Financial_Report_2026.pdf',
  'final/user-001/abc123def456.pdf',
  NULL,
  'application/pdf',
  204800,
  'READY',
  'cat-rep',
  'dept-fin',
  'user-admin-001'
);

-- ── READ ──────────────────────────────────────────────────────────────────────

-- List all READY documents with category and department info
SELECT
  d.id,
  d.title,
  d.filename,
  d."mimeType",
  d."sizeBytes",
  d.status,
  d."createdAt",
  c.name  AS category,
  dep.name AS department,
  u.name  AS uploaded_by
FROM documents d
JOIN categories  c   ON d."categoryId"   = c.id
JOIN departments dep ON d."departmentId" = dep.id
JOIN users       u   ON d."uploadedById" = u.id
WHERE d.status = 'READY'
ORDER BY d."createdAt" DESC;

-- Search documents by title or filename (case-insensitive)
SELECT d.id, d.title, d.filename, d."createdAt"
FROM documents d
WHERE d.status = 'READY'
  AND (
    d.title    ILIKE '%report%'
    OR d.filename ILIKE '%report%'
  )
ORDER BY d."createdAt" DESC;

-- Filter by department (employees only see their own department)
SELECT d.id, d.title, d.filename
FROM documents d
WHERE d.status = 'READY'
  AND d."departmentId" = 'dept-fin'
ORDER BY d."createdAt" DESC;

-- Dashboard counts
SELECT
  COUNT(*) FILTER (WHERE status = 'READY')                    AS document_count,
  COALESCE(SUM("sizeBytes") FILTER (WHERE status = 'READY'), 0) AS storage_bytes
FROM documents
WHERE "departmentId" = 'dept-fin';

-- ── UPDATE ────────────────────────────────────────────────────────────────────

-- Update document metadata (title, description, category only — not owner/dept/file)
UPDATE documents
SET    title       = 'Q3 Financial Report 2026 (Revised)',
       description = 'Updated with auditor comments.',
       "categoryId" = 'cat-rep',
       "updatedAt" = NOW()
WHERE  id = 'doc-example-001';

-- Mark document as READY after upload completion
UPDATE documents
SET    status     = 'READY',
       "stagingKey" = NULL,
       "updatedAt" = NOW()
WHERE  id = 'doc-example-001'
  AND  status = 'PENDING';

-- Promote user to ADMIN
UPDATE users
SET    role = 'ADMIN', "updatedAt" = NOW()
WHERE  id = 'user-to-promote';

-- Assign user to a department
UPDATE users
SET    "departmentId" = 'dept-hr', "updatedAt" = NOW()
WHERE  id = 'user-to-assign';

-- ── DELETE ────────────────────────────────────────────────────────────────────

-- Mark as DELETING before S3 removal (prevents new downloads)
UPDATE documents SET status = 'DELETING', "updatedAt" = NOW()
WHERE id = 'doc-example-001';

-- Hard-delete document row after S3 object is confirmed removed
DELETE FROM documents WHERE id = 'doc-example-001';

-- Deactivate a user (preserve documents; never hard-delete authors)
UPDATE users SET "isActive" = FALSE, "updatedAt" = NOW()
WHERE id = 'user-to-deactivate';

-- ── JOIN example ──────────────────────────────────────────────────────────────

-- Documents with full context (used by list and detail endpoints)
SELECT
  d.id,
  d.title,
  d.description,
  d.filename,
  d."mimeType",
  d."sizeBytes",
  d.status,
  d."createdAt",
  d."updatedAt",
  json_build_object('id', c.id,   'name', c.name)   AS category,
  json_build_object('id', dep.id, 'name', dep.name)  AS department,
  json_build_object('id', u.id,   'name', u.name)    AS "uploadedBy"
FROM  documents d
JOIN  categories  c   ON d."categoryId"   = c.id
JOIN  departments dep ON d."departmentId" = dep.id
JOIN  users       u   ON d."uploadedById" = u.id
WHERE d.status = 'READY'
  AND d."departmentId" = 'dept-fin'
ORDER BY d."createdAt" DESC
LIMIT 20 OFFSET 0;
