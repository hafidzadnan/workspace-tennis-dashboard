-- ============================================
-- Migration Script: Supabase Auth Migration
-- Option 4: Password Preservation Migration
-- ============================================
-- 
-- IMPORTANT: Execute these steps in order on Supabase SQL Editor
-- Make sure to backup database before running!
--
-- This script migrates users from public.User to auth.users
-- while preserving bcrypt password hashes.
-- ============================================

-- ============================================
-- STEP 1: Create temporary mapping table
-- ============================================
CREATE TABLE IF NOT EXISTS public._user_migration_map (
    old_id TEXT PRIMARY KEY,
    new_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    migrated_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- STEP 2: Populate mapping from public.User
-- ============================================
INSERT INTO public._user_migration_map (old_id, email, name, password_hash)
SELECT id, email, name, password
FROM public."User"
ON CONFLICT (old_id) DO NOTHING;

-- ============================================
-- STEP 3: Create profiles table
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles"
ON public.profiles FOR ALL
TO service_role
USING (true);

-- ============================================
-- STEP 4: Insert into auth.users with preserved bcrypt hash
-- Supabase auth.users supports bcrypt format
-- ============================================
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
    m.password_hash,  -- bcrypt hash preserved
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

-- ============================================
-- STEP 5: Create auth.identities for each user
-- ============================================
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

-- ============================================
-- STEP 6: Populate profiles table
-- ============================================
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

-- ============================================
-- STEP 7: Add profileId column to Member table
-- ============================================
ALTER TABLE public."Member" 
ADD COLUMN IF NOT EXISTS "profileId" UUID REFERENCES public.profiles(id);

-- ============================================
-- STEP 8: Update Member.profileId using mapping
-- ============================================
UPDATE public."Member" mem
SET "profileId" = m.new_uuid
FROM public._user_migration_map m
WHERE mem."userId" = m.old_id;

-- ============================================
-- STEP 9: Add profileId column to Role table
-- ============================================
ALTER TABLE public."Role" 
ADD COLUMN IF NOT EXISTS "profileId" UUID REFERENCES public.profiles(id);

-- ============================================
-- STEP 10: Update Role.profileId using mapping
-- ============================================
UPDATE public."Role" r
SET "profileId" = m.new_uuid
FROM public._user_migration_map m
WHERE r."userId" = m.old_id;

-- ============================================
-- STEP 11: Verify migration
-- ============================================
-- Check migrated users count
SELECT 
    (SELECT COUNT(*) FROM public._user_migration_map) as mapped_users,
    (SELECT COUNT(*) FROM auth.users WHERE email IN (SELECT email FROM public._user_migration_map)) as auth_users,
    (SELECT COUNT(*) FROM public.profiles) as profiles,
    (SELECT COUNT(*) FROM public."Member" WHERE "profileId" IS NOT NULL) as members_linked,
    (SELECT COUNT(*) FROM public."Role" WHERE "profileId" IS NOT NULL) as roles_linked;

-- ============================================
-- STEP 12: Create index on profileId columns
-- ============================================
CREATE INDEX IF NOT EXISTS "Member_profileId_idx" ON public."Member" ("profileId");
CREATE INDEX IF NOT EXISTS "Role_profileId_idx" ON public."Role" ("profileId");

-- ============================================
-- CLEANUP (RUN ONLY AFTER VERIFICATION!)
-- Uncomment these lines after confirming migration is successful
-- ============================================
-- DROP TABLE IF EXISTS public._user_migration_map;
-- ALTER TABLE public."Member" DROP COLUMN IF EXISTS "userId";
-- ALTER TABLE public."Role" DROP COLUMN IF EXISTS "userId";
-- DROP TABLE IF EXISTS public."User";

-- ============================================
-- END OF MIGRATION SCRIPT
-- ============================================
