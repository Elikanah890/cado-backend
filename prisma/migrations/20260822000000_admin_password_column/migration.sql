-- Align the Admin password column with the production database without dropping data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Admin' AND column_name = 'passwordHash'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Admin' AND column_name = 'password'
  ) THEN
    ALTER TABLE "Admin" RENAME COLUMN "passwordHash" TO "password";
  END IF;
END $$;
