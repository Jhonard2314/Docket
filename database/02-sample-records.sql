-- ============================================================
-- Docket — Script 02: Sample records
-- Demo data only. Passwords are NOT stored here.
-- Run npm run db:seed to create the admin account securely.
-- ============================================================

\c docket_db;

-- Departments
INSERT INTO departments (id, name) VALUES
  ('dept-hr',   'Human Resources'),
  ('dept-fin',  'Finance'),
  ('dept-legal','Legal'),
  ('dept-ops',  'Operations'),
  ('dept-it',   'IT & Technology'),
  ('dept-mkt',  'Marketing')
ON CONFLICT (name) DO NOTHING;

-- Categories
INSERT INTO categories (id, name) VALUES
  ('cat-pol',  'Policy'),
  ('cat-rep',  'Report'),
  ('cat-con',  'Contract'),
  ('cat-mem',  'Memo'),
  ('cat-prs',  'Presentation'),
  ('cat-inv',  'Invoice'),
  ('cat-man',  'Manual'),
  ('cat-oth',  'Other')
ON CONFLICT (name) DO NOTHING;
