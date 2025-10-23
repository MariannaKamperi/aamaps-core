-- Insert the residual risk weighting factors
INSERT INTO public.risk_weights (factor_name, category, weight, description)
VALUES 
  ('InternalAudit_ResidualWeight', 'ResidualRisk', 0.8, 'IA contribution to combined residual risk'),
  ('ERM_ResidualWeight', 'ResidualRisk', 0.2, 'ERM contribution to combined residual risk')
ON CONFLICT (factor_name) 
DO UPDATE SET 
  category = EXCLUDED.category,
  weight = EXCLUDED.weight,
  description = EXCLUDED.description;