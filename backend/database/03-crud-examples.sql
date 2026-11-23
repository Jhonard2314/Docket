-- ============================================================
-- Docket — Script 03: CRUD examples
-- ============================================================

\c docket_db;

-- CREATE
INSERT INTO documents (id, title, description, filename, "s3Key", "mimeType", "sizeBytes", status, "categoryId", "departmentId", "uploadedById")
VALUES (
  gen_random_uuid()::text, 'Q3 Financial Report', 'Third quarter summary.',
  'Q3_Report.pdf', 'uploads/user1/abc123.pdf', 'application/pdf', 204800, 'READY',
  (SELECT id FROM categories WHERE name='Report' LIMIT 1),
  (SELECT id FROM departments WHERE name='Finance' LIMIT 1),
  (SELECT id FROM users WHERE role='ADMIN' LIMIT 1)
);

-- READ
SELECT d.id, d.title, d.filename, d."mimeType", d."sizeBytes", d."createdAt",
       c.name AS category, dep.name AS department, u.name AS uploaded_by
FROM documents d
JOIN categories  c   ON d."categoryId"   = c.id
JOIN departments dep ON d."departmentId" = dep.id
JOIN users       u   ON d."uploadedById" = u.id
WHERE d.status = 'READY'
ORDER BY d."createdAt" DESC;

-- UPDATE
UPDATE documents
SET title = 'Q3 Financial Report 2026', "updatedAt" = NOW()
WHERE title = 'Q3 Financial Report';

-- DELETE
DELETE FROM documents WHERE title = 'Q3 Financial Report 2026';

-- SELECT all users (admin view)
SELECT id, name, email, role, "isActive", "createdAt" FROM users ORDER BY "createdAt" DESC;

-- UPDATE user role
UPDATE users SET role = 'DEPARTMENT_HEAD' WHERE email = 'head@docket.local';
