-- ============================================================
-- Docket Document Management System
-- Script 02: Table definitions (PostgreSQL / Amazon RDS)
-- Note: Prisma manages migrations in development.
--       These scripts document the schema for the assignment.
-- ============================================================

\c docket_db;

CREATE TYPE "Role" AS ENUM ('USER', 'DEPARTMENT_HEAD', 'ADMIN');

-- Better Auth: users
CREATE TABLE IF NOT EXISTS users (
  id              TEXT        PRIMARY KEY,
  name            TEXT        NOT NULL,
  email           TEXT        NOT NULL UNIQUE,
  "emailVerified" BOOLEAN     NOT NULL DEFAULT FALSE,
  image           TEXT,
  role            "Role"      NOT NULL DEFAULT 'USER',
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

-- Better Auth: accounts (OAuth / credentials)
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

-- App: categories
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App: documents
CREATE TABLE IF NOT EXISTS documents (
  id             TEXT        PRIMARY KEY,
  filename       TEXT        NOT NULL,
  "s3Key"        TEXT        NOT NULL,
  "mimeType"     TEXT        NOT NULL,
  "sizeBytes"    INTEGER     NOT NULL,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "categoryId"   TEXT        NOT NULL REFERENCES categories(id),
  "uploadedById" TEXT        NOT NULL REFERENCES users(id)
);
