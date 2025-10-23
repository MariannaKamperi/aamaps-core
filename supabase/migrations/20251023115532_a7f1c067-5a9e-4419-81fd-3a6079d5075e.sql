-- Drop the existing trigger
DROP TRIGGER IF EXISTS update_risk_factor_scores ON public.risk_factors;

-- Create a helper function to convert risk_level to numeric score
CREATE OR REPLACE FUNCTION public.risk_level_to_score(level risk_level)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE level
    WHEN 'High' THEN RETURN 3;
    WHEN 'Medium' THEN RETURN 2;
    WHEN 'Low' THEN RETURN 1;
    ELSE RETURN 0;
  END CASE;
END;
$$;

-- Update the calculate_inherent_risk_score function to use the helper
CREATE OR REPLACE FUNCTION public.calculate_inherent_risk_score(risk_factor_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
DECLARE
  score DECIMAL := 0;
  rf RECORD;
  weights RECORD;
BEGIN
  SELECT * INTO rf FROM public.risk_factors WHERE id = risk_factor_id;
  
  FOR weights IN SELECT factor_name, weight FROM public.risk_weights LOOP
    CASE weights.factor_name
      WHEN 'financial_impact' THEN 
        score := score + (public.risk_level_to_score(rf.financial_impact) * weights.weight);
      WHEN 'legal_compliance_impact' THEN 
        score := score + (public.risk_level_to_score(rf.legal_compliance_impact) * weights.weight);
      WHEN 'strategic_significance' THEN 
        score := score + (public.risk_level_to_score(rf.strategic_significance) * weights.weight);
      WHEN 'technological_cyber_impact' THEN 
        score := score + (public.risk_level_to_score(rf.technological_cyber_impact) * weights.weight);
      WHEN 'stakeholder_impact' THEN 
        score := score + (public.risk_level_to_score(rf.stakeholder_impact) * weights.weight);
      WHEN 'new_process_system' THEN 
        score := score + (public.risk_level_to_score(rf.new_process_system) * weights.weight);
      WHEN 'c_level_concerns' THEN 
        score := score + (public.risk_level_to_score(rf.c_level_concerns) * weights.weight);
    END CASE;
  END LOOP;
  
  RETURN score;
END;
$function$;

-- Update the update_risk_scores trigger function
CREATE OR REPLACE FUNCTION public.update_risk_scores()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.inherent_risk_score := public.calculate_inherent_risk_score(NEW.id);
  NEW.combined_residual_risk := (public.risk_level_to_score(NEW.internal_audit_residual_risk) + public.risk_level_to_score(NEW.erm_residual_risk)) / 2.0;
  
  -- Calculate combined_residual_risk_level based on score
  IF NEW.combined_residual_risk >= 2.5 THEN
    NEW.combined_residual_risk_level := 'High';
  ELSIF NEW.combined_residual_risk >= 1.5 THEN
    NEW.combined_residual_risk_level := 'Medium';
  ELSE
    NEW.combined_residual_risk_level := 'Low';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER update_risk_factor_scores
  BEFORE INSERT OR UPDATE ON public.risk_factors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_risk_scores();