-- Create enum for risk weight category
CREATE TYPE weight_category AS ENUM ('RiskFactor', 'AssuranceCoverage');

-- Add new columns to risk_weights
ALTER TABLE public.risk_weights
ADD COLUMN IF NOT EXISTS category weight_category,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Drop columns that are no longer needed
ALTER TABLE public.risk_weights
DROP COLUMN IF EXISTS threshold_high,
DROP COLUMN IF EXISTS threshold_medium,
DROP COLUMN IF EXISTS last_updated_by;

-- Insert or update the example risk weight records
INSERT INTO public.risk_weights (factor_name, category, weight, description)
VALUES 
  ('financial_impact', 'RiskFactor', 0.15, 'Potential monetary loss'),
  ('legal_compliance_impact', 'RiskFactor', 0.15, 'Legal / regulatory exposure'),
  ('strategic_significance', 'RiskFactor', 0.20, 'Strategic importance'),
  ('technological_cyber_impact', 'RiskFactor', 0.15, 'IT / Cyber impact'),
  ('new_process_system', 'RiskFactor', 0.10, 'New / untested systems'),
  ('stakeholder_impact', 'RiskFactor', 0.10, 'Impact on customers/employees'),
  ('c_level_concerns', 'RiskFactor', 0.15, 'C-level concern'),
  ('InternalAudit_Assurance', 'AssuranceCoverage', 0.50, 'Weight for Internal Audit assurance'),
  ('ThirdParty_Assurance', 'AssuranceCoverage', 0.50, 'Weight for Third Party assurance')
ON CONFLICT (factor_name) 
DO UPDATE SET 
  category = EXCLUDED.category,
  weight = EXCLUDED.weight,
  description = EXCLUDED.description;

-- Set NOT NULL constraint on category after data is populated
ALTER TABLE public.risk_weights
ALTER COLUMN category SET NOT NULL;