-- Fix security warnings by setting search_path on all functions

CREATE OR REPLACE FUNCTION public.calculate_assurance_score(coverage coverage_level_type)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.numeric_to_risk_level(score numeric)
RETURNS risk_level
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
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