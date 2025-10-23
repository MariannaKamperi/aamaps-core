-- First, add the new enum value
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ResidualRisk' AND enumtypid = 'weight_category'::regtype) THEN
    ALTER TYPE weight_category ADD VALUE 'ResidualRisk';
  END IF;
END$$;