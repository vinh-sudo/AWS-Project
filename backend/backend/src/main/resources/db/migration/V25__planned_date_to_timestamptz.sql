-- Migration: Chuyển planned_start_date và planned_end_date sang timestamp with time zone
ALTER TABLE production_plan
  ALTER COLUMN planned_start_date TYPE TIMESTAMP WITH TIME ZONE USING planned_start_date::timestamptz,
  ALTER COLUMN planned_end_date TYPE TIMESTAMP WITH TIME ZONE USING planned_end_date::timestamptz;

