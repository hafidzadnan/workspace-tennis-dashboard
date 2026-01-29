-- ============================================
-- Add CHECK constraints for DuesStatus table
-- Run this after Prisma migration
-- ============================================

-- Status must be 'lunas' or 'belum'
ALTER TABLE "DuesStatus" 
ADD CONSTRAINT "DuesStatus_status_check" 
CHECK (status IN ('lunas', 'belum'));

-- Month must be between 1 and 12
ALTER TABLE "DuesStatus" 
ADD CONSTRAINT "DuesStatus_month_check" 
CHECK (month >= 1 AND month <= 12);

-- nilaiIuran must be non-negative and max 9 digits
ALTER TABLE "DuesStatus" 
ADD CONSTRAINT "DuesStatus_nilaiIuran_check" 
CHECK ("nilaiIuran" >= 0 AND "nilaiIuran" <= 999999999);

-- Year should be reasonable (1900-2100)
ALTER TABLE "DuesStatus" 
ADD CONSTRAINT "DuesStatus_year_check" 
CHECK (year >= 1900 AND year <= 2100);
