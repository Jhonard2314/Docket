-- ============================================================
-- Docket Document Management System
-- Script 03: Seed data
-- Categories are inserted; the admin user is created via
-- the application's /api/auth/sign-up/email endpoint or
-- by running: npm run db:seed in the backend folder.
-- ============================================================

\c docket_db;

INSERT INTO categories (id, name) VALUES
  (gen_random_uuid()::text, 'Human Resources'),
  (gen_random_uuid()::text, 'Finance'),
  (gen_random_uuid()::text, 'Legal'),
  (gen_random_uuid()::text, 'Operations'),
  (gen_random_uuid()::text, 'IT & Technology'),
  (gen_random_uuid()::text, 'Marketing')
ON CONFLICT (name) DO NOTHING;
