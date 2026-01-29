-- ============================================
-- RLS Policies for PRD v2.1
-- Run after migration is complete
-- ============================================

-- ============================================
-- MEMBER TABLE RLS
-- ============================================
ALTER TABLE public."Member" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view members
CREATE POLICY "Members are viewable by authenticated users"
ON public."Member" FOR SELECT
TO authenticated
USING (true);

-- Pengurus can insert new members
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

-- Pengurus can update members
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

-- ============================================
-- DUES STATUS TABLE RLS
-- ============================================
ALTER TABLE public."DuesStatus" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view dues status
CREATE POLICY "DuesStatus are viewable by authenticated users"
ON public."DuesStatus" FOR SELECT
TO authenticated
USING (true);

-- Pengurus can insert/update dues status
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

-- ============================================
-- COURT SCHEDULE TABLE RLS
-- ============================================
ALTER TABLE public."CourtSchedule" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view schedule
CREATE POLICY "CourtSchedule are viewable by authenticated users"
ON public."CourtSchedule" FOR SELECT
TO authenticated
USING (true);

-- Pengurus can manage schedule
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

-- ============================================
-- TRANSACTION TABLE RLS
-- ============================================
ALTER TABLE public."Transaction" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view transactions
CREATE POLICY "Transactions are viewable by authenticated users"
ON public."Transaction" FOR SELECT
TO authenticated
USING (true);

-- Pengurus can insert transactions
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

-- Pengurus can update transactions
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

-- ============================================
-- ROLE TABLE RLS
-- ============================================
ALTER TABLE public."Role" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view roles (for role checking)
CREATE POLICY "Roles are viewable by authenticated users"
ON public."Role" FOR SELECT
TO authenticated
USING (true);

-- Only service role can manage roles
CREATE POLICY "Service role can manage roles"
ON public."Role" FOR ALL
TO service_role
USING (true);

-- ============================================
-- END OF RLS POLICIES
-- ============================================
