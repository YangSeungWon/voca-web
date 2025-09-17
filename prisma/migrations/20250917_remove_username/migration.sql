-- Create temporary column for email migration
ALTER TABLE "User" ADD COLUMN "email_temp" TEXT;

-- Copy username to email_temp where email is null
UPDATE "User" SET "email_temp" = 
  CASE 
    WHEN "email" IS NULL THEN "username" || '@temp.email'
    ELSE "email"
  END;

-- Drop the old constraints
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_username_key";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";
ALTER TABLE "Group" DROP CONSTRAINT IF EXISTS "Group_userId_name_key";

-- Drop username column
ALTER TABLE "User" DROP COLUMN "username";

-- Drop old email column
ALTER TABLE "User" DROP COLUMN "email";

-- Rename email_temp to email
ALTER TABLE "User" RENAME COLUMN "email_temp" TO "email";

-- Make email required and unique
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");