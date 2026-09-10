-- Admin-managed pricing categories.
CREATE TABLE "PricingCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingCategory_slug_key" ON "PricingCategory"("slug");

-- Add category + billing period to pricing plans.
ALTER TABLE "PricingPlan" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "PricingPlan" ADD COLUMN IF NOT EXISTS "period" TEXT NOT NULL DEFAULT 'one-time';

-- AddForeignKey
ALTER TABLE "PricingPlan" ADD CONSTRAINT "PricingPlan_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PricingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
