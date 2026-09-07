-- Add token_version column to Admin for session revocation.
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;
