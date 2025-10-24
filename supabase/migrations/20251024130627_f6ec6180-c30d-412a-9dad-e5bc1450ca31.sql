-- Add priority_level and proposed_audit_year to auditable_areas
ALTER TABLE public.auditable_areas 
ADD COLUMN IF NOT EXISTS priority_level integer,
ADD COLUMN IF NOT EXISTS proposed_audit_year integer;

-- Function to calculate priority level based on Excel rules
CREATE OR REPLACE FUNCTION public.calculate_priority_level(
  p_auditable_area_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_regulatory_requirement boolean;
  v_combined_residual_risk_level risk_level;
  v_assurance_haircut numeric;
  v_last_audit_date date;
  v_last_audit_result last_audit_result_type;
  v_years_since_audit numeric;
BEGIN
  -- Get auditable area data
  SELECT 
    aa.regulatory_requirement,
    aa.last_audit_date,
    aa.last_audit_result
  INTO 
    v_regulatory_requirement,
    v_last_audit_date,
    v_last_audit_result
  FROM public.auditable_areas aa
  WHERE aa.id = p_auditable_area_id;
  
  -- Get risk data from risk_factors
  SELECT 
    rf.combined_residual_risk_level,
    rf.assurance_haircut
  INTO 
    v_combined_residual_risk_level,
    v_assurance_haircut
  FROM public.risk_factors rf
  WHERE rf.auditable_area_id = p_auditable_area_id
  LIMIT 1;
  
  -- Calculate years since last audit
  IF v_last_audit_date IS NOT NULL THEN
    v_years_since_audit := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_last_audit_date));
  END IF;
  
  -- Apply priority logic based on Excel rules
  -- Level 1: Regulatory requirement
  IF v_regulatory_requirement = TRUE THEN
    RETURN 1;
  END IF;
  
  -- Level 2: High risk, never audited before
  IF v_combined_residual_risk_level = 'High' AND v_last_audit_date IS NULL THEN
    RETURN 2;
  END IF;
  
  -- Level 3: High risk, audited in last 3 years with unresolved high findings
  IF v_combined_residual_risk_level = 'High' 
     AND v_years_since_audit <= 3 
     AND v_last_audit_result = 'High findings' THEN
    RETURN 3;
  END IF;
  
  -- Level 4: High risk, other cases
  IF v_combined_residual_risk_level = 'High' THEN
    RETURN 4;
  END IF;
  
  -- Level 5: Medium risk, never audited before
  IF v_combined_residual_risk_level = 'Medium' AND v_last_audit_date IS NULL THEN
    RETURN 5;
  END IF;
  
  -- Level 6: Medium risk, audited in last 3 years with unresolved high findings
  IF v_combined_residual_risk_level = 'Medium' 
     AND v_years_since_audit <= 3 
     AND v_last_audit_result = 'High findings' THEN
    RETURN 6;
  END IF;
  
  -- Level 7: Medium risk, other cases
  IF v_combined_residual_risk_level = 'Medium' THEN
    RETURN 7;
  END IF;
  
  -- Level 8: Low risk, limited assurance (haircut <= 0.3)
  IF v_combined_residual_risk_level = 'Low' AND COALESCE(v_assurance_haircut, 0) <= 0.3 THEN
    RETURN 8;
  END IF;
  
  -- Level 9: Low risk, moderate assurance (haircut <= 0.6)
  IF v_combined_residual_risk_level = 'Low' AND COALESCE(v_assurance_haircut, 0) <= 0.6 THEN
    RETURN 9;
  END IF;
  
  -- Level 10: Low risk, comprehensive assurance
  RETURN 10;
END;
$$;

-- Function to calculate proposed audit year based on priority level
CREATE OR REPLACE FUNCTION public.calculate_proposed_audit_year(
  p_priority_level integer
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  CASE 
    WHEN p_priority_level IN (1, 2, 3) THEN RETURN 2026;
    WHEN p_priority_level IN (4, 5, 6) THEN RETURN 2027;
    WHEN p_priority_level IN (7, 8, 9, 10) THEN RETURN 2028;
    ELSE RETURN 2028;
  END CASE;
END;
$$;

-- Function to update priority and audit year for an auditable area
CREATE OR REPLACE FUNCTION public.update_audit_priority(
  p_auditable_area_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_priority_level integer;
  v_proposed_year integer;
BEGIN
  -- Calculate priority level
  v_priority_level := public.calculate_priority_level(p_auditable_area_id);
  
  -- Calculate proposed audit year
  v_proposed_year := public.calculate_proposed_audit_year(v_priority_level);
  
  -- Update auditable_areas table
  UPDATE public.auditable_areas
  SET 
    priority_level = v_priority_level,
    proposed_audit_year = v_proposed_year,
    updated_at = now()
  WHERE id = p_auditable_area_id;
END;
$$;

-- Trigger to update priority when risk factors change
CREATE OR REPLACE FUNCTION public.trigger_priority_recalc_on_risk_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update audit priority for this auditable area
  PERFORM public.update_audit_priority(NEW.auditable_area_id);
  
  RETURN NEW;
END;
$$;

-- Trigger to update priority when auditable area changes
CREATE OR REPLACE FUNCTION public.trigger_priority_recalc_on_area_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update audit priority for this auditable area
  PERFORM public.update_audit_priority(NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create trigger on risk_factors for priority recalculation
DROP TRIGGER IF EXISTS trigger_recalc_priority_on_risk_update ON public.risk_factors;
CREATE TRIGGER trigger_recalc_priority_on_risk_update
  AFTER INSERT OR UPDATE OF combined_residual_risk_level, assurance_haircut
  ON public.risk_factors
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_priority_recalc_on_risk_change();

-- Create trigger on auditable_areas for priority recalculation
DROP TRIGGER IF EXISTS trigger_recalc_priority_on_area_update ON public.auditable_areas;
CREATE TRIGGER trigger_recalc_priority_on_area_update
  AFTER INSERT OR UPDATE OF regulatory_requirement, last_audit_date, last_audit_result
  ON public.auditable_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_priority_recalc_on_area_change();

-- Create trigger on assurance_coverage to trigger priority recalculation via risk_factors
DROP TRIGGER IF EXISTS trigger_priority_recalc_on_assurance_change ON public.assurance_coverage;
CREATE TRIGGER trigger_priority_recalc_on_assurance_change
  AFTER INSERT OR UPDATE OR DELETE
  ON public.assurance_coverage
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_risk_recalc_on_assurance_change();