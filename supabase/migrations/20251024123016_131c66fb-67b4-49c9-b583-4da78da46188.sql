-- 1. Add assurance_haircut column to risk_factors
ALTER TABLE public.risk_factors 
ADD COLUMN IF NOT EXISTS assurance_haircut numeric;

-- 2. Update or create weight entries for assurance coverage
-- First, check if old names exist and update them
UPDATE public.risk_weights 
SET factor_name = 'Assurance_InternalAudit'
WHERE factor_name = 'InternalAudit_Assurance' AND category = 'AssuranceCoverage';

UPDATE public.risk_weights 
SET factor_name = 'Assurance_ThirdParty'
WHERE factor_name = 'ThirdParty_Assurance' AND category = 'AssuranceCoverage';

-- 3. Update the coverage level to score function
CREATE OR REPLACE FUNCTION public.coverage_level_to_score(level coverage_level_type)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  CASE level
    WHEN 'Comprehensive' THEN RETURN 0.95;
    WHEN 'Moderate' THEN RETURN 0.5;
    WHEN 'Limited' THEN RETURN 0.15;
    ELSE RETURN 0;
  END CASE;
END;
$$;

-- 4. Update erm_residual_risk to numeric mapping
CREATE OR REPLACE FUNCTION public.erm_risk_level_to_score(level risk_level)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  CASE level
    WHEN 'High' THEN RETURN 5;
    WHEN 'Medium' THEN RETURN 3;
    WHEN 'Low' THEN RETURN 1;
    ELSE RETURN 0;
  END CASE;
END;
$$;

-- 5. Create function to calculate assurance haircut for an auditable area
CREATE OR REPLACE FUNCTION public.calculate_assurance_haircut(area_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ia_coverage_score numeric := 0;
  tp_coverage_score numeric := 0;
  ia_weight numeric := 0.5;
  tp_weight numeric := 0.5;
  total_haircut numeric;
BEGIN
  -- Get weights from risk_weights table
  SELECT weight INTO ia_weight
  FROM public.risk_weights
  WHERE factor_name = 'Assurance_InternalAudit' AND category = 'AssuranceCoverage'
  LIMIT 1;
  
  SELECT weight INTO tp_weight
  FROM public.risk_weights
  WHERE factor_name = 'Assurance_ThirdParty' AND category = 'AssuranceCoverage'
  LIMIT 1;
  
  -- Get Internal Audit coverage score
  SELECT COALESCE(public.coverage_level_to_score(coverage_level), 0)
  INTO ia_coverage_score
  FROM public.assurance_coverage
  WHERE auditable_area_id = area_id AND provider_type = 'InternalAudit'
  LIMIT 1;
  
  -- Get Third Party coverage score
  SELECT COALESCE(public.coverage_level_to_score(coverage_level), 0)
  INTO tp_coverage_score
  FROM public.assurance_coverage
  WHERE auditable_area_id = area_id AND provider_type = 'ThirdParty'
  LIMIT 1;
  
  -- Calculate total haircut with cap at 0.95
  total_haircut := LEAST(0.95, (ia_coverage_score * ia_weight) + (tp_coverage_score * tp_weight));
  
  RETURN total_haircut;
END;
$$;

-- 6. Update the risk scores calculation function
CREATE OR REPLACE FUNCTION public.update_risk_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  haircut numeric;
  ia_residual_numeric numeric;
  erm_residual_numeric numeric;
  combined_residual numeric;
  area_category text;
BEGIN
  -- Calculate inherent risk score
  NEW.inherent_risk_score := public.calculate_inherent_risk_score(NEW.id);
  
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
  NEW.combined_residual_risk := combined_residual;
  
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
$$;

-- 7. Update trigger to recalculate when assurance coverage changes
CREATE OR REPLACE FUNCTION public.trigger_risk_recalc_on_assurance_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update all risk factors for this auditable area
  UPDATE public.risk_factors
  SET updated_at = now()
  WHERE auditable_area_id = COALESCE(NEW.auditable_area_id, OLD.auditable_area_id);
  
  RETURN NEW;
END;
$$;

-- 8. Create triggers if they don't exist
DROP TRIGGER IF EXISTS trigger_update_risk_scores ON public.risk_factors;
CREATE TRIGGER trigger_update_risk_scores
  BEFORE INSERT OR UPDATE ON public.risk_factors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_risk_scores();

DROP TRIGGER IF EXISTS trigger_recalc_on_assurance_update ON public.assurance_coverage;
CREATE TRIGGER trigger_recalc_on_assurance_update
  AFTER INSERT OR UPDATE ON public.assurance_coverage
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_risk_recalc_on_assurance_change();