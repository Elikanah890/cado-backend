-- Drop galleryImages column from Portfolio (single featuredImage remains)
ALTER TABLE "Portfolio" DROP COLUMN IF EXISTS "galleryImages";
