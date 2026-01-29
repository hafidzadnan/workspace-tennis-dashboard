-- ============================================
-- Add CHECK constraints for CourtSchedule table
-- Also standardize timeSlot to lowercase
-- Run this after Prisma migration
-- ============================================

-- First, standardize existing timeSlot values to lowercase
UPDATE "CourtSchedule" SET "timeSlot" = LOWER("timeSlot");

-- dayOfWeek must be between 1 (Monday) and 7 (Sunday)
ALTER TABLE "CourtSchedule" 
ADD CONSTRAINT "CourtSchedule_dayOfWeek_check" 
CHECK ("dayOfWeek" >= 1 AND "dayOfWeek" <= 7);

-- timeSlot must be one of the valid slots (lowercase)
ALTER TABLE "CourtSchedule" 
ADD CONSTRAINT "CourtSchedule_timeSlot_check" 
CHECK ("timeSlot" IN ('pagi', 'sore', 'malam'));

-- status must be one of the valid statuses
ALTER TABLE "CourtSchedule" 
ADD CONSTRAINT "CourtSchedule_status_check" 
CHECK (status IN ('vacant', 'occupied', 'canceled'));
