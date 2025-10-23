-- Create risk_level enum for Low, Medium, High
CREATE TYPE risk_level AS ENUM ('Low', 'Medium', 'High');

-- Add the missing combined_residual_risk_level field
ALTER TABLE public.risk_factors
ADD COLUMN IF NOT EXISTS combined_residual_risk_level risk_level;

-- Create new columns with enum type for all risk factor fields
ALTER TABLE public.risk_factors
ADD COLUMN financial_impact_new risk_level,
ADD COLUMN legal_compliance_impact_new risk_level,
ADD COLUMN strategic_significance_new risk_level,
ADD COLUMN technological_cyber_impact_new risk_level,
ADD COLUMN new_process_system_new risk_level,
ADD COLUMN stakeholder_impact_new risk_level,
ADD COLUMN c_level_concerns_new risk_level,
ADD COLUMN internal_audit_residual_risk_new risk_level,
ADD COLUMN erm_residual_risk_new risk_level;

-- Migrate data: convert integer values to enum (1-2=Low, 3=Medium, 4-5=High)
UPDATE public.risk_factors SET
  financial_impact_new = CASE 
    WHEN financial_impact <= 2 THEN 'Low'::risk_level
    WHEN financial_impact = 3 THEN 'Medium'::risk_level
    ELSE 'High'::risk_level
  END,
  legal_compliance_impact_new = CASE 
    WHEN legal_compliance_impact <= 2 THEN 'Low'::risk_level
    WHEN legal_compliance_impact = 3 THEN 'Medium'::risk_level
    ELSE 'High'::risk_level
  END,
  strategic_significance_new = CASE 
    WHEN strategic_significance <= 2 THEN 'Low'::risk_level
    WHEN strategic_significance = 3 THEN 'Medium'::risk_level
    ELSE 'High'::risk_level
  END,
  technological_cyber_impact_new = CASE 
    WHEN technological_cyber_impact <= 2 THEN 'Low'::risk_level
    WHEN technological_cyber_impact = 3 THEN 'Medium'::risk_level
    ELSE 'High'::risk_level
  END,
  new_process_system_new = CASE 
    WHEN new_process_system <= 2 THEN 'Low'::risk_level
    WHEN new_process_system = 3 THEN 'Medium'::risk_level
    ELSE 'High'::risk_level
  END,
  stakeholder_impact_new = CASE 
    WHEN stakeholder_impact <= 2 THEN 'Low'::risk_level
    WHEN stakeholder_impact = 3 THEN 'Medium'::risk_level
    ELSE 'High'::risk_level
  END,
  c_level_concerns_new = CASE 
    WHEN c_level_concerns <= 2 THEN 'Low'::risk_level
    WHEN c_level_concerns = 3 THEN 'Medium'::risk_level
    ELSE 'High'::risk_level
  END,
  internal_audit_residual_risk_new = CASE 
    WHEN internal_audit_residual_risk <= 2 THEN 'Low'::risk_level
    WHEN internal_audit_residual_risk = 3 THEN 'Medium'::risk_level
    ELSE 'High'::risk_level
  END,
  erm_residual_risk_new = CASE 
    WHEN erm_residual_risk <= 2 THEN 'Low'::risk_level
    WHEN erm_residual_risk = 3 THEN 'Medium'::risk_level
    ELSE 'High'::risk_level
  END;

-- Drop old integer columns
ALTER TABLE public.risk_factors
DROP COLUMN financial_impact,
DROP COLUMN legal_compliance_impact,
DROP COLUMN strategic_significance,
DROP COLUMN technological_cyber_impact,
DROP COLUMN new_process_system,
DROP COLUMN stakeholder_impact,
DROP COLUMN c_level_concerns,
DROP COLUMN internal_audit_residual_risk,
DROP COLUMN erm_residual_risk;

-- Rename new columns to original names
ALTER TABLE public.risk_factors
RENAME COLUMN financial_impact_new TO financial_impact;

ALTER TABLE public.risk_factors
RENAME COLUMN legal_compliance_impact_new TO legal_compliance_impact;

ALTER TABLE public.risk_factors
RENAME COLUMN strategic_significance_new TO strategic_significance;

ALTER TABLE public.risk_factors
RENAME COLUMN technological_cyber_impact_new TO technological_cyber_impact;

ALTER TABLE public.risk_factors
RENAME COLUMN new_process_system_new TO new_process_system;

ALTER TABLE public.risk_factors
RENAME COLUMN stakeholder_impact_new TO stakeholder_impact;

ALTER TABLE public.risk_factors
RENAME COLUMN c_level_concerns_new TO c_level_concerns;

ALTER TABLE public.risk_factors
RENAME COLUMN internal_audit_residual_risk_new TO internal_audit_residual_risk;

ALTER TABLE public.risk_factors
RENAME COLUMN erm_residual_risk_new TO erm_residual_risk;

-- Set NOT NULL constraints with defaults
ALTER TABLE public.risk_factors
ALTER COLUMN financial_impact SET DEFAULT 'Medium'::risk_level,
ALTER COLUMN financial_impact SET NOT NULL,
ALTER COLUMN legal_compliance_impact SET DEFAULT 'Medium'::risk_level,
ALTER COLUMN legal_compliance_impact SET NOT NULL,
ALTER COLUMN strategic_significance SET DEFAULT 'Medium'::risk_level,
ALTER COLUMN strategic_significance SET NOT NULL,
ALTER COLUMN technological_cyber_impact SET DEFAULT 'Medium'::risk_level,
ALTER COLUMN technological_cyber_impact SET NOT NULL,
ALTER COLUMN new_process_system SET DEFAULT 'Medium'::risk_level,
ALTER COLUMN new_process_system SET NOT NULL,
ALTER COLUMN stakeholder_impact SET DEFAULT 'Medium'::risk_level,
ALTER COLUMN stakeholder_impact SET NOT NULL,
ALTER COLUMN c_level_concerns SET DEFAULT 'Medium'::risk_level,
ALTER COLUMN c_level_concerns SET NOT NULL,
ALTER COLUMN internal_audit_residual_risk SET DEFAULT 'Medium'::risk_level,
ALTER COLUMN internal_audit_residual_risk SET NOT NULL,
ALTER COLUMN erm_residual_risk SET DEFAULT 'Medium'::risk_level,
ALTER COLUMN erm_residual_risk SET NOT NULL;