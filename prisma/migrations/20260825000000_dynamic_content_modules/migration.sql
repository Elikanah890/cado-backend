-- Align Store, Academy, and Blog fields with the dynamic content API.
ALTER TABLE "Course" ALTER COLUMN "price" DROP NOT NULL;
ALTER TABLE "CourseLesson" ALTER COLUMN "sortOrder" SET DEFAULT 0;
UPDATE "CourseLesson" SET "sortOrder" = 0 WHERE "sortOrder" IS NULL;
ALTER TABLE "CourseLesson" ALTER COLUMN "sortOrder" SET NOT NULL;

ALTER TABLE "BlogPost" ALTER COLUMN "content" SET DEFAULT '';
UPDATE "BlogPost" SET "content" = '' WHERE "content" IS NULL;
ALTER TABLE "BlogPost" ALTER COLUMN "content" SET NOT NULL;

ALTER TABLE "BlogTag" ADD COLUMN IF NOT EXISTS "slug" TEXT;
UPDATE "BlogTag" SET "slug" = regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g') || '-' || substring("id" from 1 for 6) WHERE "slug" IS NULL;
ALTER TABLE "BlogTag" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "BlogTag_slug_key" ON "BlogTag"("slug");
