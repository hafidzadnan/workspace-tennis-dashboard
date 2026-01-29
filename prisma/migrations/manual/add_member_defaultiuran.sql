-- ============================================
-- Migration: Add defaultIuran to Member table
-- Make email required and unique
-- Run this on Supabase SQL Editor
-- ============================================

-- Step 1: Add defaultIuran column with default value
ALTER TABLE "Member" 
ADD COLUMN IF NOT EXISTS "defaultIuran" INTEGER NOT NULL DEFAULT 100000;

-- Step 2: Update existing null emails with generated values (backup before running!)
-- UPDATE "Member" SET email = CONCAT('member_', id, '@tennis.com') WHERE email IS NULL;

-- Step 3: Make email NOT NULL (only after ensuring all rows have email)
-- ALTER TABLE "Member" ALTER COLUMN email SET NOT NULL;

-- Step 4: Add unique constraint on email (only after making NOT NULL)
-- ALTER TABLE "Member" ADD CONSTRAINT "Member_email_key" UNIQUE (email);

-- Step 5: Add index on email for performance
CREATE INDEX IF NOT EXISTS "Member_email_idx" ON "Member" (email);
