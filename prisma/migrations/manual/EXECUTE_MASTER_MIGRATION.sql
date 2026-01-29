-- ============================================
-- MASTER MIGRATION SCRIPT FOR PRD Addendum v2.1
-- Execute this on Supabase SQL Editor
-- Date: 29 January 2026
-- ============================================
-- 
-- EXECUTION ORDER:
-- 1. Phase 1a: Add defaultIuran column to Member
-- 2. Phase 1b: Add CHECK constraints to DuesStatus
-- 3. Phase 1c: Standardize CourtSchedule timeSlot + constraints
-- 4. Phase 3a: Create profiles table
-- 5. Phase 3b: Migrate User to auth.users
-- 6. Phase 3c: Setup RLS policies
--
-- IMPORTANT: Review each section before running!
-- ============================================

-- ================================================
-- PHASE 1a: ADD defaultIuran TO MEMBER
-- ================================================

-- Add defaultIuran column with default value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Member' AND column_name = 'defaultIuran'
    ) THEN
        ALTER TABLE "Member" ADD COLUMN "defaultIuran" INTEGER NOT NULL DEFAULT 100000;
        RAISE NOTICE 'Added defaultIuran column to Member table';
    ELSE
        RAISE NOTICE 'defaultIuran column already exists';
    END IF;
END $$;

-- Create index on email for performance
CREATE INDEX IF NOT EXISTS "Member_email_idx" ON "Member" (email);

-- ================================================
-- PHASE 1b: ADD CHECK CONSTRAINTS TO DuesStatus
-- ================================================

-- Status must be 'lunas' or 'belum'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DuesStatus_status_check'
    ) THEN
        ALTER TABLE "DuesStatus" 
        ADD CONSTRAINT "DuesStatus_status_check" 
        CHECK (status IN ('lunas', 'belum'));
        RAISE NOTICE 'Added DuesStatus_status_check constraint';
    END IF;
END $$;

-- Month must be between 1 and 12
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DuesStatus_month_check'
    ) THEN
        ALTER TABLE "DuesStatus" 
        ADD CONSTRAINT "DuesStatus_month_check" 
        CHECK (month >= 1 AND month <= 12);
        RAISE NOTICE 'Added DuesStatus_month_check constraint';
    END IF;
END $$;

-- nilaiIuran must be non-negative and max 9 digits
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DuesStatus_nilaiIuran_check'
    ) THEN
        ALTER TABLE "DuesStatus" 
        ADD CONSTRAINT "DuesStatus_nilaiIuran_check" 
        CHECK ("nilaiIuran" >= 0 AND "nilaiIuran" <= 999999999);
        RAISE NOTICE 'Added DuesStatus_nilaiIuran_check constraint';
    END IF;
END $$;

-- Year should be reasonable (1900-2100)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DuesStatus_year_check'
    ) THEN
        ALTER TABLE "DuesStatus" 
        ADD CONSTRAINT "DuesStatus_year_check" 
        CHECK (year >= 1900 AND year <= 2100);
        RAISE NOTICE 'Added DuesStatus_year_check constraint';
    END IF;
END $$;

-- ================================================
-- PHASE 1c: STANDARDIZE CourtSchedule timeSlot
-- ================================================

-- Standardize existing timeSlot values to lowercase
UPDATE "CourtSchedule" SET "timeSlot" = LOWER("timeSlot") 
WHERE "timeSlot" != LOWER("timeSlot");

-- Add CHECK constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CourtSchedule_dayOfWeek_check'
    ) THEN
        ALTER TABLE "CourtSchedule" 
        ADD CONSTRAINT "CourtSchedule_dayOfWeek_check" 
        CHECK ("dayOfWeek" >= 1 AND "dayOfWeek" <= 7);
        RAISE NOTICE 'Added CourtSchedule_dayOfWeek_check constraint';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CourtSchedule_timeSlot_check'
    ) THEN
        ALTER TABLE "CourtSchedule" 
        ADD CONSTRAINT "CourtSchedule_timeSlot_check" 
        CHECK ("timeSlot" IN ('pagi', 'sore', 'malam'));
        RAISE NOTICE 'Added CourtSchedule_timeSlot_check constraint';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CourtSchedule_status_check'
    ) THEN
        ALTER TABLE "CourtSchedule" 
        ADD CONSTRAINT "CourtSchedule_status_check" 
        CHECK (status IN ('vacant', 'occupied', 'canceled'));
        RAISE NOTICE 'Added CourtSchedule_status_check constraint';
    END IF;
END $$;

-- ================================================
-- PHASE 1 VERIFICATION
-- ================================================
SELECT 'Phase 1 Complete' as status;
SELECT 
    (SELECT COUNT(*) FROM "Member" WHERE "defaultIuran" IS NOT NULL) as members_with_iuran,
    (SELECT COUNT(*) FROM "CourtSchedule" WHERE "timeSlot" = LOWER("timeSlot")) as schedule_lowercase;

-- ================================================
-- PHASE 3a: CREATE PROFILES TABLE
-- ================================================

-- Create profiles table if not exists (MUST be before FK columns)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add profileId column to Member table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Member' AND column_name = 'profileId'
    ) THEN
        ALTER TABLE "Member" ADD COLUMN "profileId" UUID REFERENCES public.profiles(id);
        RAISE NOTICE 'Added profileId column to Member table';
    END IF;
END $$;

-- Add profileId column to Role table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Role' AND column_name = 'profileId'
    ) THEN
        ALTER TABLE "Role" ADD COLUMN "profileId" UUID REFERENCES public.profiles(id);
        RAISE NOTICE 'Added profileId column to Role table';
    END IF;
END $$;

-- Add createdByProfileId column to Transaction table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Transaction' AND column_name = 'createdByProfileId'
    ) THEN
        ALTER TABLE "Transaction" ADD COLUMN "createdByProfileId" UUID REFERENCES public.profiles(id);
        RAISE NOTICE 'Added createdByProfileId column to Transaction table';
    END IF;
END $$;

-- ================================================
-- PHASE 3b: MIGRATE USER TO AUTH.USERS
-- ================================================

-- Step 1: Create temporary mapping table
CREATE TABLE IF NOT EXISTS public._user_migration_map (
    old_id TEXT PRIMARY KEY,
    new_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    migrated_at TIMESTAMP DEFAULT now()
);

-- Step 2: Populate mapping from public.User (skip if already populated)
INSERT INTO public._user_migration_map (old_id, email, name, password_hash)
SELECT id, email, name, password
FROM public."User"
WHERE NOT EXISTS (
    SELECT 1 FROM public._user_migration_map m WHERE m.old_id = "User".id
);

-- Step 3: Insert into auth.users with preserved bcrypt hash
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
)
SELECT 
    m.new_uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    m.email,
    m.password_hash,
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', m.name),
    'authenticated',
    'authenticated'
FROM public._user_migration_map m
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.email = m.email
);

-- Step 4: Create auth.identities for each user
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    created_at,
    updated_at,
    last_sign_in_at
)
SELECT 
    gen_random_uuid(),
    m.new_uuid,
    jsonb_build_object('sub', m.new_uuid::text, 'email', m.email),
    'email',
    m.new_uuid::text,
    now(),
    now(),
    now()
FROM public._user_migration_map m
WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities ai WHERE ai.user_id = m.new_uuid
);

-- Step 5: Populate profiles table
INSERT INTO public.profiles (id, name, "createdAt", "updatedAt")
SELECT 
    m.new_uuid,
    COALESCE(m.name, m.email),
    now(),
    now()
FROM public._user_migration_map m
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = m.new_uuid
);

-- Step 6: Update Member.profileId using mapping
UPDATE public."Member" mem
SET "profileId" = m.new_uuid
FROM public._user_migration_map m
WHERE mem."userId" = m.old_id AND mem."profileId" IS NULL;

-- Step 7: Update Role.profileId using mapping
UPDATE public."Role" r
SET "profileId" = m.new_uuid
FROM public._user_migration_map m
WHERE r."userId" = m.old_id AND r."profileId" IS NULL;

-- ================================================
-- PHASE 3b VERIFICATION
-- ================================================
SELECT 'Phase 3b Verification' as status;
SELECT 
    (SELECT COUNT(*) FROM public._user_migration_map) as mapped_users,
    (SELECT COUNT(*) FROM auth.users WHERE email IN (SELECT email FROM public._user_migration_map)) as auth_users,
    (SELECT COUNT(*) FROM public.profiles) as profiles,
    (SELECT COUNT(*) FROM public."Member" WHERE "profileId" IS NOT NULL) as members_linked,
    (SELECT COUNT(*) FROM public."Role" WHERE "profileId" IS NOT NULL) as roles_linked;

-- Create indexes
CREATE INDEX IF NOT EXISTS "Member_profileId_idx" ON public."Member" ("profileId");
CREATE INDEX IF NOT EXISTS "Role_profileId_idx" ON public."Role" ("profileId");

-- ================================================
-- PHASE 3c: SETUP RLS POLICIES
-- ================================================

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles"
ON public.profiles FOR ALL
TO service_role
USING (true);

-- Member RLS
ALTER TABLE public."Member" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members are viewable by authenticated users" ON public."Member";
CREATE POLICY "Members are viewable by authenticated users"
ON public."Member" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Pengurus can insert members" ON public."Member";
CREATE POLICY "Pengurus can insert members"
ON public."Member" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Role" r 
    WHERE r."profileId" = auth.uid() 
    AND r."roleName" = 'pengurus'
  )
);

DROP POLICY IF EXISTS "Pengurus can update members" ON public."Member";
CREATE POLICY "Pengurus can update members"
ON public."Member" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."Role" r 
    WHERE r."profileId" = auth.uid() 
    AND r."roleName" = 'pengurus'
  )
);

-- DuesStatus RLS
ALTER TABLE public."DuesStatus" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DuesStatus are viewable by authenticated users" ON public."DuesStatus";
CREATE POLICY "DuesStatus are viewable by authenticated users"
ON public."DuesStatus" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Pengurus can manage dues status" ON public."DuesStatus";
CREATE POLICY "Pengurus can manage dues status"
ON public."DuesStatus" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."Role" r 
    WHERE r."profileId" = auth.uid() 
    AND r."roleName" = 'pengurus'
  )
);

-- CourtSchedule RLS
ALTER TABLE public."CourtSchedule" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CourtSchedule are viewable by authenticated users" ON public."CourtSchedule";
CREATE POLICY "CourtSchedule are viewable by authenticated users"
ON public."CourtSchedule" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Pengurus can manage court schedule" ON public."CourtSchedule";
CREATE POLICY "Pengurus can manage court schedule"
ON public."CourtSchedule" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."Role" r 
    WHERE r."profileId" = auth.uid() 
    AND r."roleName" = 'pengurus'
  )
);

-- Transaction RLS
ALTER TABLE public."Transaction" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transactions are viewable by authenticated users" ON public."Transaction";
CREATE POLICY "Transactions are viewable by authenticated users"
ON public."Transaction" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Pengurus can insert transactions" ON public."Transaction";
CREATE POLICY "Pengurus can insert transactions"
ON public."Transaction" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Role" r 
    WHERE r."profileId" = auth.uid() 
    AND r."roleName" = 'pengurus'
  )
);

DROP POLICY IF EXISTS "Pengurus can update transactions" ON public."Transaction";
CREATE POLICY "Pengurus can update transactions"
ON public."Transaction" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."Role" r 
    WHERE r."profileId" = auth.uid() 
    AND r."roleName" = 'pengurus'
  )
);

-- Role RLS
ALTER TABLE public."Role" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON public."Role";
CREATE POLICY "Roles are viewable by authenticated users"
ON public."Role" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Service role can manage roles" ON public."Role";
CREATE POLICY "Service role can manage roles"
ON public."Role" FOR ALL
TO service_role
USING (true);

-- ================================================
-- FINAL VERIFICATION
-- ================================================
SELECT 'MIGRATION COMPLETE!' as status;
SELECT 
    'Members' as table_name, COUNT(*) as count FROM public."Member"
UNION ALL
SELECT 
    'Profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 
    'Auth Users' as table_name, COUNT(*) as count FROM auth.users 
    WHERE email IN (SELECT email FROM public._user_migration_map)
UNION ALL
SELECT 
    'Roles' as table_name, COUNT(*) as count FROM public."Role";

-- ================================================
-- POST-MIGRATION CLEANUP (RUN AFTER VERIFICATION!)
-- Uncomment these lines ONLY after confirming everything works
-- ================================================
-- DROP TABLE IF EXISTS public._user_migration_map;
-- ALTER TABLE public."Member" DROP COLUMN IF EXISTS "userId";
-- ALTER TABLE public."Role" DROP COLUMN IF EXISTS "userId";
-- DROP TABLE IF EXISTS public."User";
