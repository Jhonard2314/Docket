-- Migration: Add approval workflow and archive features
-- Date: 2026-11-24

-- Add new document status values
ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- Add new columns to documents table
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT;

-- Add new columns to departments table
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();

-- Add foreign key for approvedBy
ALTER TABLE documents
  ADD CONSTRAINT "documents_approvedById_fkey" 
  FOREIGN KEY ("approvedById") REFERENCES users(id) 
  ON DELETE SET NULL;

-- Migrate existing READY documents to APPROVED status
UPDATE documents 
SET status = 'APPROVED', "approvedAt" = "createdAt"
WHERE status = 'READY';

-- Create index for faster approval queries
CREATE INDEX IF NOT EXISTS "documents_status_departmentId_idx" ON documents(status, "departmentId");
CREATE INDEX IF NOT EXISTS "documents_archivedAt_idx" ON documents("archivedAt") WHERE "archivedAt" IS NOT NULL;
