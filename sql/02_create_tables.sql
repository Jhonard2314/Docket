-- ============================================================
-- Docket Document Management System
-- Script 02: Table definitions
-- ============================================================

USE docket_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  role          ENUM('admin','user') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  category_name VARCHAR(100)    NOT NULL UNIQUE,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  filename      VARCHAR(255)    NOT NULL,
  s3_key        VARCHAR(500)    NOT NULL,
  category_id   INT UNSIGNED    NOT NULL,
  uploaded_by   INT UNSIGNED    NOT NULL,
  upload_date   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_doc_category  FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_doc_uploader  FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
