-- Add assurance score columns to assurance_coverage table
ALTER TABLE public.assurance_coverage 
ADD COLUMN IF NOT EXISTS assurance_by_internal_audit_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS assurance_by_third_party_score numeric DEFAULT 0;

-- Create function to calculate assurance scores based on coverage level
CREATE OR REPLACE FUNCTION public.calculate_assurance_score(coverage coverage_level_type)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  CASE coverage
    WHEN 'Comprehensive' THEN RETURN 0.95;
    WHEN 'Moderate' THEN RETURN 0.5;
    WHEN 'Limited' THEN RETURN 0.15;
    ELSE RETURN 0;
  END CASE;
END;
$function$;

-- Create function to map numeric residual risk to risk level
CREATE OR REPLACE FUNCTION public.numeric_to_risk_level(score numeric)
RETURNS risk_level
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  IF score > 3.5 THEN
    RETURN 'High'::risk_level;
  ELSIF score > 2.0 THEN
    RETURN 'Medium'::risk_level;
  ELSE
    RETURN 'Low'::risk_level;
  END IF;
END;
$function$;

-- Create trigger function to update assurance scores when coverage changes
CREATE OR REPLACE FUNCTION public.update_assurance_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  calculated_score numeric;
BEGIN
  -- Calculate the score based on coverage level
  calculated_score := public.calculate_assurance_score(NEW.coverage_level);
  
  -- Update the appropriate score field based on provider type
  IF NEW.provider_type = 'InternalAudit' THEN
    NEW.assurance_by_internal_audit_score := calculated_score;
    NEW.assurance_by_third_party_score := 0;
  ELSIF NEW.provider_type = 'ThirdParty' THEN
    NEW.assurance_by_internal_audit_score := 0;
    NEW.assurance_by_third_party_score := calculated_score;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically update assurance scores
DROP TRIGGER IF EXISTS trigger_update_assurance_scores ON public.assurance_coverage;
CREATE TRIGGER trigger_update_assurance_scores
  BEFORE INSERT OR UPDATE ON public.assurance_coverage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_assurance_scores();

-- Create function to calculate residual risks based on assurance coverage
CREATE OR REPLACE FUNCTION public.calculate_residual_risks(risk_factor_id uuid)
RETURNS TABLE(
  internal_audit_residual risk_level,
  erm_residual risk_level
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inherent_score numeric;
  ia_assurance_score numeric := 0;
  tp_assurance_score numeric := 0;
  ia_residual_numeric numeric;
  erm_residual_numeric numeric;
  area_id uuid;
BEGIN
  -- Get inherent risk score and auditable area id
  SELECT rf.inherent_risk_score, rf.auditable_area_id
  INTO inherent_score, area_id
  FROM public.risk_factors rf
  WHERE rf.id = risk_factor_id;
  
  -- Get assurance scores for this auditable area
  SELECT 
    COALESCE(MAX(CASE WHEN provider_type = 'InternalAudit' THEN assurance_by_internal_audit_score END), 0),
    COALESCE(MAX(CASE WHEN provider_type = 'ThirdParty' THEN assurance_by_third_party_score END), 0)
  INTO ia_assurance_score, tp_assurance_score
  FROM public.assurance_coverage
  WHERE auditable_area_id = area_id;
  
  -- Calculate residual risks
  ia_residual_numeric := ROUND((inherent_score * (1 - ia_assurance_score))::numeric, 1);
  erm_residual_numeric := ROUND((inherent_score * (1 - tp_assurance_score))::numeric, 1);
  
  -- Convert to risk levels
  RETURN QUERY SELECT 
    public.numeric_to_risk_level(ia_residual_numeric),
    public.numeric_to_risk_level(erm_residual_numeric);
END;
$function$;

-- Update the existing risk score trigger to also calculate residual risks
CREATE OR REPLACE FUNCTION public.update_risk_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  residual_risks RECORD;
BEGIN
  -- Calculate inherent risk score
  NEW.inherent_risk_score := public.calculate_inherent_risk_score(NEW.id);
  
  -- Calculate residual risks based on assurance coverage
  SELECT * INTO residual_risks FROM public.calculate_residual_risks(NEW.id);
  
  NEW.internal_audit_residual_risk := residual_risks.internal_audit_residual;
  NEW.erm_residual_risk := residual_risks.erm_residual;
  
  -- Calculate combined residual risk
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

-- Create trigger to update risk factors when assurance coverage changes
CREATE OR REPLACE FUNCTION public.trigger_risk_recalc_on_assurance_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update all risk factors for this auditable area
  UPDATE public.risk_factors
  SET updated_at = now()
  WHERE auditable_area_id = NEW.auditable_area_id;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_recalc_risks_on_assurance ON public.assurance_coverage;
CREATE TRIGGER trigger_recalc_risks_on_assurance
  AFTER INSERT OR UPDATE ON public.assurance_coverage
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_risk_recalc_on_assurance_change();