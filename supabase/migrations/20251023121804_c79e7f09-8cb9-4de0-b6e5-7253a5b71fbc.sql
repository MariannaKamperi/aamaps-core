-- Fix the calculate_inherent_risk_score function to include ELSE clause
CREATE OR REPLACE FUNCTION public.calculate_inherent_risk_score(risk_factor_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  score DECIMAL := 0;
  rf RECORD;
  weights RECORD;
BEGIN
  SELECT * INTO rf FROM public.risk_factors WHERE id = risk_factor_id;
  
  FOR weights IN SELECT factor_name, weight FROM public.risk_weights WHERE category = 'RiskFactor' LOOP
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
      ELSE
        -- Skip unknown factor names
        NULL;
    END CASE;
  END LOOP;
  
  RETURN score;
END;
$function$;