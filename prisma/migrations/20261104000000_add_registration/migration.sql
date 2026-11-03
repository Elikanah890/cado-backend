-- CreateTable
CREATE TABLE IF NOT EXISTS "Registration" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "location" TEXT,
    "category" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemSlug" TEXT,
    "details" JSONB,
    "message" TEXT,
    "preferredContact" TEXT NOT NULL DEFAULT 'whatsapp',
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "internalNotes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Registration_ref_key" ON "Registration"("ref");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Registration_status_idx" ON "Registration"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Registration_category_idx" ON "Registration"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Registration_createdAt_idx" ON "Registration"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Registration_phone_idx" ON "Registration"("phone");
