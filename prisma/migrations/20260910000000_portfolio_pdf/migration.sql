-- Add PDF support to Portfolio (company profiles, case-study downloads).
ALTER TABLE "Portfolio" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
ALTER TABLE "Portfolio" ADD COLUMN IF NOT EXISTS "pdfName" TEXT;
