-- Add new columns to assurance_coverage
ALTER TABLE public.assurance_coverage 
ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS assurance_score NUMERIC;

-- Create new enum type for provider_type with only InternalAudit and ThirdParty
CREATE TYPE provider_type_new AS ENUM ('InternalAudit', 'ThirdParty');

-- Add temporary column with new enum type
ALTER TABLE public.assurance_coverage 
ADD COLUMN provider_type_new provider_type_new;

-- Migrate data: map old values to new ones
UPDATE public.assurance_coverage 
SET provider_type_new = CASE 
  WHEN provider_type::text = 'InternalAudit' THEN 'InternalAudit'::provider_type_new
  WHEN provider_type::text IN ('ExternalAudit', 'InfoSec', 'Compliance', 'RiskMgmt') THEN 'ThirdParty'::provider_type_new
  ELSE 'InternalAudit'::provider_type_new
END;

-- Set NOT NULL constraint on new column
ALTER TABLE public.assurance_coverage 
ALTER COLUMN provider_type_new SET NOT NULL;

-- Drop old column
ALTER TABLE public.assurance_coverage 
DROP COLUMN provider_type;

-- Rename new column to original name
ALTER TABLE public.assurance_coverage 
RENAME COLUMN provider_type_new TO provider_type;

-- Drop old enum type
DROP TYPE provider_type;

-- Rename new enum type to original name
ALTER TYPE provider_type_new RENAME TO provider_type;

-- Set default for provider_type
ALTER TABLE public.assurance_coverage 
ALTER COLUMN provider_type SET DEFAULT 'InternalAudit'::provider_type;