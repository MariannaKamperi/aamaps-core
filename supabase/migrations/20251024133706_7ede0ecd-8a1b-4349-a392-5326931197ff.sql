-- Drop and recreate the calculate_inherent_risk_score function to work with NEW values inline
-- We'll modify the trigger to calculate the score directly instead of querying the database

DROP FUNCTION IF EXISTS public.calculate_inherent_risk_score(uuid);

-- Recreate the trigger function to calculate scores inline using NEW record values
CREATE OR REPLACE FUNCTION public.update_risk_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  score DECIMAL := 0;
  weight_val DECIMAL;
  haircut numeric;
  ia_residual_numeric numeric;
  erm_residual_numeric numeric;
  combined_residual numeric;
  area_category text;
BEGIN
  -- Calculate inherent risk score directly using NEW values and weights from risk_weights table
  
  -- Financial Impact
  SELECT weight INTO weight_val FROM public.risk_weights 
  WHERE factor_name = 'financial_impact' AND category = 'RiskFactor' LIMIT 1;
  score := score + (public.risk_level_to_score(NEW.financial_impact) * COALESCE(weight_val, 0));
  
  -- Legal/Compliance Impact
  SELECT weight INTO weight_val FROM public.risk_weights 
  WHERE factor_name = 'legal_compliance_impact' AND category = 'RiskFactor' LIMIT 1;
  score := score + (public.risk_level_to_score(NEW.legal_compliance_impact) * COALESCE(weight_val, 0));
  
  -- Strategic Significance
  SELECT weight INTO weight_val FROM public.risk_weights 
  WHERE factor_name = 'strategic_significance' AND category = 'RiskFactor' LIMIT 1;
  score := score + (public.risk_level_to_score(NEW.strategic_significance) * COALESCE(weight_val, 0));
  
  -- Technological/Cyber Impact
  SELECT weight INTO weight_val FROM public.risk_weights 
  WHERE factor_name = 'technological_cyber_impact' AND category = 'RiskFactor' LIMIT 1;
  score := score + (public.risk_level_to_score(NEW.technological_cyber_impact) * COALESCE(weight_val, 0));
  
  -- Stakeholder Impact
  SELECT weight INTO weight_val FROM public.risk_weights 
  WHERE factor_name = 'stakeholder_impact' AND category = 'RiskFactor' LIMIT 1;
  score := score + (public.risk_level_to_score(NEW.stakeholder_impact) * COALESCE(weight_val, 0));
  
  -- New Process/System
  SELECT weight INTO weight_val FROM public.risk_weights 
  WHERE factor_name = 'new_process_system' AND category = 'RiskFactor' LIMIT 1;
  score := score + (public.risk_level_to_score(NEW.new_process_system) * COALESCE(weight_val, 0));
  
  -- C-Level Concerns
  SELECT weight INTO weight_val FROM public.risk_weights 
  WHERE factor_name = 'c_level_concerns' AND category = 'RiskFactor' LIMIT 1;
  score := score + (public.risk_level_to_score(NEW.c_level_concerns) * COALESCE(weight_val, 0));
  
  -- Set inherent risk score
  NEW.inherent_risk_score := ROUND(score, 2);
  
  -- Calculate assurance haircut
  haircut := public.calculate_assurance_haircut(NEW.auditable_area_id);
  NEW.assurance_haircut := haircut;
  
  -- Get auditable area category
  SELECT category INTO area_category
  FROM public.auditable_areas
  WHERE id = NEW.auditable_area_id;
  
  -- Calculate Internal Audit Residual Risk
  IF area_category = 'Non Auditable Area' THEN
    ia_residual_numeric := 0;
  ELSE
    ia_residual_numeric := NEW.inherent_risk_score * (1 - haircut);
  END IF;
  
  -- Get ERM residual risk numeric value
  erm_residual_numeric := public.erm_risk_level_to_score(NEW.erm_residual_risk);
  
  -- Calculate combined residual risk
  combined_residual := (0.8 * ia_residual_numeric) + (0.2 * erm_residual_numeric);
  NEW.combined_residual_risk := ROUND(combined_residual, 2);
  
  -- Set internal_audit_residual_risk level
  IF ia_residual_numeric <= 2.0 THEN
    NEW.internal_audit_residual_risk := 'Low';
  ELSIF ia_residual_numeric <= 3.5 THEN
    NEW.internal_audit_residual_risk := 'Medium';
  ELSE
    NEW.internal_audit_residual_risk := 'High';
  END IF;
  
  -- Set combined_residual_risk_level
  IF combined_residual <= 2.0 THEN
    NEW.combined_residual_risk_level := 'Low';
  ELSIF combined_residual <= 3.5 THEN
    NEW.combined_residual_risk_level := 'Medium';
  ELSE
    NEW.combined_residual_risk_level := 'High';
  END IF;
  
  RETURN NEW;
END;
$function$;