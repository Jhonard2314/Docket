-- ============================================================
-- Docket Document Management System
-- Script 03: Seed data (default admin + sample categories)
-- Password for admin@docket.com is: Admin@1234
-- (bcrypt hash generated with 12 salt rounds)
-- ============================================================

USE docket_db;

INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
  ('System Admin', 'admin@docket.com',
   '$2a$12$e0NdoLAeMGMxjMHnI4j1nOl8TSXPfGzOVz/DRbhCdRPW1p5YxEEWq', 'admin');

INSERT IGNORE INTO categories (category_name) VALUES
  ('Human Resources'),
  ('Finance'),
  ('Legal'),
  ('Operations'),
  ('IT & Technology'),
  ('Marketing');
