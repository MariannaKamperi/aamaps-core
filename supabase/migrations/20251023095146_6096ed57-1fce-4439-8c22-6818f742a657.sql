-- Create enum types for dropdowns
CREATE TYPE public.category_type AS ENUM ('Operational', 'Financial', 'IT', 'Compliance', 'HR');
CREATE TYPE public.last_audit_result_type AS ENUM ('None', 'No findings', 'Medium findings', 'High findings');
CREATE TYPE public.provider_type AS ENUM ('InternalAudit', 'InfoSec', 'Compliance', 'RiskMgmt', 'ExternalAudit');
CREATE TYPE public.coverage_level_type AS ENUM ('Comprehensive', 'Moderate', 'Limited');
CREATE TYPE public.change_type AS ENUM ('Create', 'Update', 'Delete');
CREATE TYPE public.app_role AS ENUM ('admin', 'auditor', 'viewer');

-- Create Entity table
CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create AuditableArea table
CREATE TABLE public.auditable_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  business_unit TEXT NOT NULL,
  category category_type NOT NULL,
  responsible_c_level TEXT,
  regulation TEXT,
  regulatory_requirement BOOLEAN DEFAULT false,
  last_audit_date DATE,
  last_audit_result last_audit_result_type DEFAULT 'None',
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create RiskFactor table
CREATE TABLE public.risk_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auditable_area_id UUID REFERENCES public.auditable_areas(id) ON DELETE CASCADE NOT NULL UNIQUE,
  financial_impact INTEGER CHECK (financial_impact BETWEEN 1 AND 5) NOT NULL DEFAULT 3,
  legal_compliance_impact INTEGER CHECK (legal_compliance_impact BETWEEN 1 AND 5) NOT NULL DEFAULT 3,
  strategic_significance INTEGER CHECK (strategic_significance BETWEEN 1 AND 5) NOT NULL DEFAULT 3,
  technological_cyber_impact INTEGER CHECK (technological_cyber_impact BETWEEN 1 AND 5) NOT NULL DEFAULT 3,
  stakeholder_impact INTEGER CHECK (stakeholder_impact BETWEEN 1 AND 5) NOT NULL DEFAULT 3,
  new_process_system INTEGER CHECK (new_process_system BETWEEN 1 AND 5) NOT NULL DEFAULT 3,
  c_level_concerns INTEGER CHECK (c_level_concerns BETWEEN 1 AND 5) NOT NULL DEFAULT 3,
  inherent_risk_score DECIMAL(10,2),
  internal_audit_residual_risk INTEGER CHECK (internal_audit_residual_risk BETWEEN 1 AND 5) NOT NULL DEFAULT 3,
  erm_residual_risk INTEGER CHECK (erm_residual_risk BETWEEN 1 AND 5) NOT NULL DEFAULT 3,
  combined_residual_risk DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create AssuranceCoverage table
CREATE TABLE public.assurance_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auditable_area_id UUID REFERENCES public.auditable_areas(id) ON DELETE CASCADE NOT NULL,
  provider_type provider_type NOT NULL,
  coverage_level coverage_level_type NOT NULL,
  last_assurance_date DATE,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create PriorityResult table
CREATE TABLE public.priority_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auditable_area_id UUID REFERENCES public.auditable_areas(id) ON DELETE CASCADE NOT NULL,
  priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 10) NOT NULL,
  proposed_audit_year INTEGER NOT NULL,
  overridden BOOLEAN DEFAULT false,
  justification TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create RiskWeights table
CREATE TABLE public.risk_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factor_name TEXT NOT NULL UNIQUE,
  weight DECIMAL(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 1),
  threshold_high DECIMAL(10,2) NOT NULL,
  threshold_medium DECIMAL(10,2) NOT NULL,
  last_updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create AuditTrail table
CREATE TABLE public.audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  change_type change_type NOT NULL,
  before_value TEXT,
  after_value TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  justification TEXT
);

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditable_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- RLS Policies for entities
CREATE POLICY "Everyone can view entities" ON public.entities
  FOR SELECT USING (public.is_authenticated());

CREATE POLICY "Admins and auditors can insert entities" ON public.entities
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins and auditors can update entities" ON public.entities
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins can delete entities" ON public.entities
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for auditable_areas
CREATE POLICY "Everyone can view auditable areas" ON public.auditable_areas
  FOR SELECT USING (public.is_authenticated());

CREATE POLICY "Admins and auditors can insert auditable areas" ON public.auditable_areas
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins and auditors can update auditable areas" ON public.auditable_areas
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins can delete auditable areas" ON public.auditable_areas
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for risk_factors
CREATE POLICY "Everyone can view risk factors" ON public.risk_factors
  FOR SELECT USING (public.is_authenticated());

CREATE POLICY "Admins and auditors can insert risk factors" ON public.risk_factors
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins and auditors can update risk factors" ON public.risk_factors
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins can delete risk factors" ON public.risk_factors
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assurance_coverage
CREATE POLICY "Everyone can view assurance coverage" ON public.assurance_coverage
  FOR SELECT USING (public.is_authenticated());

CREATE POLICY "Admins and auditors can insert assurance coverage" ON public.assurance_coverage
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins and auditors can update assurance coverage" ON public.assurance_coverage
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins can delete assurance coverage" ON public.assurance_coverage
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for priority_results
CREATE POLICY "Everyone can view priority results" ON public.priority_results
  FOR SELECT USING (public.is_authenticated());

CREATE POLICY "Admins and auditors can insert priority results" ON public.priority_results
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins and auditors can update priority results" ON public.priority_results
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins can delete priority results" ON public.priority_results
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for risk_weights
CREATE POLICY "Everyone can view risk weights" ON public.risk_weights
  FOR SELECT USING (public.is_authenticated());

CREATE POLICY "Admins can modify risk weights" ON public.risk_weights
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_trail
CREATE POLICY "Everyone can view audit trail" ON public.audit_trail
  FOR SELECT USING (public.is_authenticated());

CREATE POLICY "System can insert audit trail" ON public.audit_trail
  FOR INSERT WITH CHECK (public.is_authenticated());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auditable_areas_updated_at BEFORE UPDATE ON public.auditable_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_factors_updated_at BEFORE UPDATE ON public.risk_factors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assurance_coverage_updated_at BEFORE UPDATE ON public.assurance_coverage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_priority_results_updated_at BEFORE UPDATE ON public.priority_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_weights_updated_at BEFORE UPDATE ON public.risk_weights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default risk weights
INSERT INTO public.risk_weights (factor_name, weight, threshold_high, threshold_medium, last_updated_by) VALUES
  ('financial_impact', 0.20, 4.0, 2.5, 'system'),
  ('legal_compliance_impact', 0.15, 4.0, 2.5, 'system'),
  ('strategic_significance', 0.15, 4.0, 2.5, 'system'),
  ('technological_cyber_impact', 0.15, 4.0, 2.5, 'system'),
  ('stakeholder_impact', 0.10, 4.0, 2.5, 'system'),
  ('new_process_system', 0.10, 4.0, 2.5, 'system'),
  ('c_level_concerns', 0.15, 4.0, 2.5, 'system');

-- Create function to calculate inherent risk score
CREATE OR REPLACE FUNCTION public.calculate_inherent_risk_score(risk_factor_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  score DECIMAL := 0;
  rf RECORD;
  weights RECORD;
BEGIN
  SELECT * INTO rf FROM public.risk_factors WHERE id = risk_factor_id;
  
  FOR weights IN SELECT factor_name, weight FROM public.risk_weights LOOP
    CASE weights.factor_name
      WHEN 'financial_impact' THEN score := score + (rf.financial_impact * weights.weight);
      WHEN 'legal_compliance_impact' THEN score := score + (rf.legal_compliance_impact * weights.weight);
      WHEN 'strategic_significance' THEN score := score + (rf.strategic_significance * weights.weight);
      WHEN 'technological_cyber_impact' THEN score := score + (rf.technological_cyber_impact * weights.weight);
      WHEN 'stakeholder_impact' THEN score := score + (rf.stakeholder_impact * weights.weight);
      WHEN 'new_process_system' THEN score := score + (rf.new_process_system * weights.weight);
      WHEN 'c_level_concerns' THEN score := score + (rf.c_level_concerns * weights.weight);
    END CASE;
  END LOOP;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate risk scores
CREATE OR REPLACE FUNCTION public.update_risk_scores()
RETURNS TRIGGER AS $$
BEGIN
  NEW.inherent_risk_score := public.calculate_inherent_risk_score(NEW.id);
  NEW.combined_residual_risk := (NEW.internal_audit_residual_risk + NEW.erm_residual_risk) / 2.0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_risk_scores_on_insert
  BEFORE INSERT ON public.risk_factors
  FOR EACH ROW EXECUTE FUNCTION public.update_risk_scores();

CREATE TRIGGER calculate_risk_scores_on_update
  BEFORE UPDATE ON public.risk_factors
  FOR EACH ROW EXECUTE FUNCTION public.update_risk_scores();