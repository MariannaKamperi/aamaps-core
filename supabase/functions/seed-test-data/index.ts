import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskWeight {
  factor_name: string;
  category: string;
  weight: number;
  description?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting test data seeding...');

    // 1. Insert or update risk_weights
    const weightsToInsert: RiskWeight[] = [
      { factor_name: 'financial_impact', category: 'RiskFactor', weight: 0.15, description: 'Financial impact weight' },
      { factor_name: 'legal_compliance_impact', category: 'RiskFactor', weight: 0.15, description: 'Legal compliance weight' },
      { factor_name: 'strategic_significance', category: 'RiskFactor', weight: 0.20, description: 'Strategic significance weight' },
      { factor_name: 'technological_cyber_impact', category: 'RiskFactor', weight: 0.15, description: 'Tech/cyber impact weight' },
      { factor_name: 'new_process_system', category: 'RiskFactor', weight: 0.10, description: 'New process/system weight' },
      { factor_name: 'stakeholder_impact', category: 'RiskFactor', weight: 0.10, description: 'Stakeholder impact weight' },
      { factor_name: 'c_level_concerns', category: 'RiskFactor', weight: 0.15, description: 'C-level concerns weight' },
      { factor_name: 'Assurance_InternalAudit', category: 'AssuranceCoverage', weight: 0.50, description: 'Internal audit assurance weight' },
      { factor_name: 'Assurance_ThirdParty', category: 'AssuranceCoverage', weight: 0.50, description: 'Third party assurance weight' },
      { factor_name: 'InternalAudit_ResidualWeight', category: 'ResidualRisk', weight: 0.80, description: 'Internal audit residual weight' },
      { factor_name: 'ERM_ResidualWeight', category: 'ResidualRisk', weight: 0.20, description: 'ERM residual weight' }
    ];

    for (const weight of weightsToInsert) {
      const { data: existing } = await supabase
        .from('risk_weights')
        .select('id')
        .eq('factor_name', weight.factor_name)
        .eq('category', weight.category)
        .maybeSingle();

      if (!existing) {
        const { error: weightError } = await supabase
          .from('risk_weights')
          .insert(weight);

        if (weightError) {
          console.error('Error inserting weight:', weight.factor_name, weightError);
          throw weightError;
        }
        console.log('Inserted weight:', weight.factor_name);
      } else {
        console.log('Weight already exists:', weight.factor_name);
      }
    }

    // 2. Check if auditable_area exists, create entity if needed
    let auditableAreaId: string;
    
    const { data: existingArea } = await supabase
      .from('auditable_areas')
      .select('id')
      .eq('name', 'Online Casino Operations')
      .maybeSingle();

    if (existingArea) {
      auditableAreaId = existingArea.id;
      console.log('Using existing auditable area:', auditableAreaId);
    } else {
      // Create entity first
      const { data: entity, error: entityError } = await supabase
        .from('entities')
        .insert({ name: 'Test Entity' })
        .select()
        .single();

      if (entityError) {
        console.error('Error inserting entity:', entityError);
        throw entityError;
      }
      console.log('Inserted entity:', entity.id);

      // Insert auditable_area
      const { data: auditableArea, error: areaError } = await supabase
        .from('auditable_areas')
        .insert({
          name: 'Online Casino Operations',
          business_unit: 'Online',
          category: 'Operational',
          regulatory_requirement: false,
          comments: 'Test area for logic validation.',
          entity_id: entity.id
        })
        .select()
        .single();

      if (areaError) {
        console.error('Error inserting auditable area:', areaError);
        throw areaError;
      }
      
      auditableAreaId = auditableArea.id;
      console.log('Inserted auditable area:', auditableAreaId);
    }

    // 4. Insert risk_factor
    const { data: riskFactor, error: riskError } = await supabase
      .from('risk_factors')
      .insert({
        auditable_area_id: auditableAreaId,
        financial_impact: 'High',
        legal_compliance_impact: 'Medium',
        strategic_significance: 'High',
        technological_cyber_impact: 'Medium',
        new_process_system: 'Low',
        stakeholder_impact: 'High',
        c_level_concerns: 'High',
        internal_audit_residual_risk: 'High',
        erm_residual_risk: 'Medium'
      })
      .select()
      .single();

    if (riskError) {
      console.error('Error inserting risk factor:', riskError);
      throw riskError;
    }
    console.log('Inserted risk factor:', riskFactor.id);

    // 5. Insert assurance_coverage records
    const coverageRecords = [
      {
        auditable_area_id: auditableAreaId,
        provider_type: 'InternalAudit',
        coverage_level: 'Comprehensive'
      },
      {
        auditable_area_id: auditableAreaId,
        provider_type: 'ThirdParty',
        coverage_level: 'Moderate'
      }
    ];

    const { error: coverageError } = await supabase
      .from('assurance_coverage')
      .insert(coverageRecords);

    if (coverageError) {
      console.error('Error inserting assurance coverage:', coverageError);
      throw coverageError;
    }
    console.log('Inserted assurance coverage records');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test data created successfully',
        data: {
          auditable_area_id: auditableAreaId,
          risk_factor_id: riskFactor.id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error seeding test data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
