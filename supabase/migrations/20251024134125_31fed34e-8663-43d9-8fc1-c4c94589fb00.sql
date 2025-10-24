-- Create the trigger that calls update_risk_scores() on the risk_factors table
DROP TRIGGER IF EXISTS trigger_update_risk_scores ON public.risk_factors;

CREATE TRIGGER trigger_update_risk_scores
BEFORE INSERT OR UPDATE ON public.risk_factors
FOR EACH ROW
EXECUTE FUNCTION public.update_risk_scores();