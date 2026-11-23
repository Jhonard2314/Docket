-- ============================================================
-- Docket — Script 01: Full schema (PostgreSQL / Amazon RDS)
-- Matches prisma/schema.prisma exactly.
-- ============================================================

\c docket_db;

CREATE TYPE "Role"           AS ENUM ('EMPLOYEE', 'DEPARTMENT_HEAD', 'ADMIN');
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'READY', 'DELETING');

CREATE TABLE IF NOT EXISTS users (
  id              TEXT        PRIMARY KEY,
  name            TEXT        NOT NULL,
  email           TEXT        NOT NULL UNIQUE,
  "passwordHash"  TEXT        NOT NULL,
  role            "Role"      NOT NULL DEFAULT 'EMPLOYEE',
  "isActive"      BOOLEAN     NOT NULL DEFAULT TRUE,
  "departmentId"  TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT        PRIMARY KEY,
  token       TEXT        NOT NULL UNIQUE,
  "userId"    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires     TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD CONSTRAINT fk_users_department
  FOREIGN KEY ("departmentId") REFERENCES departments(id);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id             TEXT             PRIMARY KEY,
  title          TEXT             NOT NULL,
  description    TEXT             NOT NULL DEFAULT '',
  filename       TEXT             NOT NULL,
  "s3Key"        TEXT             NOT NULL UNIQUE,
  "mimeType"     TEXT             NOT NULL,
  "sizeBytes"    INTEGER          NOT NULL CHECK ("sizeBytes" >= 0),
  status         "DocumentStatus" NOT NULL DEFAULT 'READY',
  "createdAt"    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "categoryId"   TEXT             NOT NULL REFERENCES categories(id),
  "departmentId" TEXT             NOT NULL REFERENCES departments(id),
  "uploadedById" TEXT             NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_documents_uploader   ON documents ("uploadedById");
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents ("departmentId");
CREATE INDEX IF NOT EXISTS idx_documents_category   ON documents ("categoryId");
CREATE INDEX IF NOT EXISTS idx_documents_status     ON documents (status);
