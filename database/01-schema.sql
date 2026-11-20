-- ============================================================
-- Docket — Script 01: Full schema
-- Matches prisma/schema.prisma exactly.
-- Note: in development Prisma runs migrations; these scripts are
-- the assignment SQL deliverable and can bootstrap a clean database.
-- ============================================================

\c docket_db;

-- Enumerations
CREATE TYPE "Role"           AS ENUM ('EMPLOYEE', 'DEPARTMENT_HEAD', 'ADMIN');
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'READY', 'DELETING');

-- Better Auth: users
CREATE TABLE IF NOT EXISTS users (
  id              TEXT        PRIMARY KEY,
  name            TEXT        NOT NULL,
  email           TEXT        NOT NULL UNIQUE,
  "emailVerified" BOOLEAN     NOT NULL DEFAULT FALSE,
  image           TEXT,
  role            "Role"      NOT NULL DEFAULT 'EMPLOYEE',
  "isActive"      BOOLEAN     NOT NULL DEFAULT TRUE,
  "departmentId"  TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Better Auth: sessions
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT        PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  token       TEXT        NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId"    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Better Auth: accounts
CREATE TABLE IF NOT EXISTS accounts (
  id                       TEXT        PRIMARY KEY,
  "accountId"              TEXT        NOT NULL,
  "providerId"             TEXT        NOT NULL,
  "accessToken"            TEXT,
  "refreshToken"           TEXT,
  "idToken"                TEXT,
  "accessTokenExpiresAt"   TIMESTAMPTZ,
  "refreshTokenExpiresAt"  TIMESTAMPTZ,
  scope                    TEXT,
  password                 TEXT,
  "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId"                 TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Better Auth: verifications
CREATE TABLE IF NOT EXISTS verifications (
  id           TEXT        PRIMARY KEY,
  identifier   TEXT        NOT NULL,
  value        TEXT        NOT NULL,
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App: departments
CREATE TABLE IF NOT EXISTS departments (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK from users to departments (after both tables exist)
ALTER TABLE users
  ADD CONSTRAINT fk_users_department
  FOREIGN KEY ("departmentId") REFERENCES departments(id);

-- App: categories
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App: documents
CREATE TABLE IF NOT EXISTS documents (
  id             TEXT             PRIMARY KEY,
  title          TEXT             NOT NULL,
  description    TEXT,
  filename       TEXT             NOT NULL,
  "s3Key"        TEXT             NOT NULL UNIQUE,
  "stagingKey"   TEXT,
  "mimeType"     TEXT             NOT NULL,
  "sizeBytes"    INTEGER          NOT NULL CHECK ("sizeBytes" >= 0),
  status         "DocumentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "categoryId"   TEXT             NOT NULL REFERENCES categories(id),
  "departmentId" TEXT             NOT NULL REFERENCES departments(id),
  "uploadedById" TEXT             NOT NULL REFERENCES users(id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_documents_uploader   ON documents ("uploadedById");
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents ("departmentId");
CREATE INDEX IF NOT EXISTS idx_documents_category   ON documents ("categoryId");
CREATE INDEX IF NOT EXISTS idx_documents_status     ON documents (status);
