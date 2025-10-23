-- Add weight_ref column to assurance_coverage
ALTER TABLE public.assurance_coverage
ADD COLUMN IF NOT EXISTS weight_ref UUID;

-- Add foreign key constraints
ALTER TABLE public.assurance_coverage
ADD CONSTRAINT fk_assurance_coverage_auditable_area
FOREIGN KEY (auditable_area_id) REFERENCES public.auditable_areas(id) ON DELETE CASCADE;

ALTER TABLE public.assurance_coverage
ADD CONSTRAINT fk_assurance_coverage_weight_ref
FOREIGN KEY (weight_ref) REFERENCES public.risk_weights(id) ON DELETE SET NULL;

ALTER TABLE public.auditable_areas
ADD CONSTRAINT fk_auditable_areas_entity
FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE public.entities
ADD CONSTRAINT fk_entities_parent
FOREIGN KEY (parent_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE public.priority_results
ADD CONSTRAINT fk_priority_results_auditable_area
FOREIGN KEY (auditable_area_id) REFERENCES public.auditable_areas(id) ON DELETE CASCADE;

ALTER TABLE public.risk_factors
ADD CONSTRAINT fk_risk_factors_auditable_area
FOREIGN KEY (auditable_area_id) REFERENCES public.auditable_areas(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles
ADD CONSTRAINT fk_user_roles_user
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;