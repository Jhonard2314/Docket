-- ============================================================
-- Docket Document Management System
-- Script 01: Create database (run as superuser)
-- ============================================================

-- Create the database (run once as a superuser e.g. postgres)
CREATE DATABASE docket_db
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE   'en_US.UTF-8';

-- Connect to it before running subsequent scripts
\c docket_db;
