-- ============================================================
-- Docket — Script 00: Create database
-- Run as a PostgreSQL superuser (e.g. postgres).
-- ============================================================

CREATE DATABASE docket_db
  ENCODING    'UTF8'
  LC_COLLATE  'en_US.UTF-8'
  LC_CTYPE    'en_US.UTF-8'
  TEMPLATE    template0;

\c docket_db;
