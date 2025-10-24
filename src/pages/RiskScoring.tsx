import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type RiskLevel = 'Low' | 'Medium' | 'High';
type CoverageLevel = 'Comprehensive' | 'Moderate' | 'Limited';

interface AuditableArea {
  id: string;
  name: string;
  business_unit: string;
  category: string;
  regulatory_requirement: boolean;
}

interface RiskFactorData {
  id?: string;
  financial_impact: RiskLevel;
  legal_compliance_impact: RiskLevel;
  strategic_significance: RiskLevel;
  technological_cyber_impact: RiskLevel;
  new_process_system: RiskLevel;
  stakeholder_impact: RiskLevel;
  c_level_concerns: RiskLevel;
  inherent_risk_score: number | null;
  internal_audit_residual_risk: RiskLevel;
  erm_residual_risk: RiskLevel;
  assurance_haircut: number | null;
  combined_residual_risk: number | null;
  combined_residual_risk_level: RiskLevel | null;
}

const RiskScoring = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [auditableArea, setAuditableArea] = useState<AuditableArea | null>(null);
  const [riskFactors, setRiskFactors] = useState<RiskFactorData>({
    financial_impact: 'Medium',
    legal_compliance_impact: 'Medium',
    strategic_significance: 'Medium',
    technological_cyber_impact: 'Medium',
    new_process_system: 'Medium',
    stakeholder_impact: 'Medium',
    c_level_concerns: 'Medium',
    inherent_risk_score: null,
    internal_audit_residual_risk: 'Medium',
    erm_residual_risk: 'Medium',
    assurance_haircut: null,
    combined_residual_risk: null,
    combined_residual_risk_level: null,
  });
  
  const [iaCoverage, setIaCoverage] = useState<CoverageLevel>('Limited');
  const [tpCoverage, setTpCoverage] = useState<CoverageLevel>('Limited');
  const [iaCoverageId, setIaCoverageId] = useState<string | null>(null);
  const [tpCoverageId, setTpCoverageId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    
    try {
      // Fetch auditable area
      const { data: area, error: areaError } = await supabase
        .from('auditable_areas')
        .select('*')
        .eq('id', id)
        .single();

      if (areaError) throw areaError;
      setAuditableArea(area);

      // Fetch risk factors
      const { data: riskData, error: riskError } = await supabase
        .from('risk_factors')
        .select('*')
        .eq('auditable_area_id', id)
        .maybeSingle();

      if (riskError) throw riskError;
      
      if (riskData) {
        setRiskFactors({
          id: riskData.id,
          financial_impact: riskData.financial_impact,
          legal_compliance_impact: riskData.legal_compliance_impact,
          strategic_significance: riskData.strategic_significance,
          technological_cyber_impact: riskData.technological_cyber_impact,
          new_process_system: riskData.new_process_system,
          stakeholder_impact: riskData.stakeholder_impact,
          c_level_concerns: riskData.c_level_concerns,
          inherent_risk_score: riskData.inherent_risk_score,
          internal_audit_residual_risk: riskData.internal_audit_residual_risk,
          erm_residual_risk: riskData.erm_residual_risk,
          assurance_haircut: riskData.assurance_haircut,
          combined_residual_risk: riskData.combined_residual_risk,
          combined_residual_risk_level: riskData.combined_residual_risk_level,
        });
      }

      // Fetch assurance coverage
      const { data: coverages, error: covError } = await supabase
        .from('assurance_coverage')
        .select('*')
        .eq('auditable_area_id', id);

      if (covError) throw covError;
      
      if (coverages) {
        const iaCov = coverages.find(c => c.provider_type === 'InternalAudit');
        const tpCov = coverages.find(c => c.provider_type === 'ThirdParty');
        
        if (iaCov) {
          setIaCoverage(iaCov.coverage_level as CoverageLevel);
          setIaCoverageId(iaCov.id);
        }
        if (tpCov) {
          setTpCoverage(tpCov.coverage_level as CoverageLevel);
          setTpCoverageId(tpCov.id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load risk scoring data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegulatoryToggle = async (checked: boolean) => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('auditable_areas')
        .update({ regulatory_requirement: checked })
        .eq('id', id);

      if (error) throw error;

      setAuditableArea(prev => prev ? { ...prev, regulatory_requirement: checked } : null);
      toast.success('Regulatory requirement updated');
    } catch (error) {
      console.error('Error updating regulatory requirement:', error);
      toast.error('Failed to update regulatory requirement');
    }
  };

  const handleRiskFactorChange = async (field: keyof RiskFactorData, value: RiskLevel) => {
    if (!id) return;
    
    try {
      setSaving(true);
      
      // Immediately update state for UI responsiveness
      setRiskFactors(prev => ({
        ...prev,
        [field]: value,
      }));
      
      const updateData = {
        [field]: value,
      };

      let riskFactorId = riskFactors.id;

      if (!riskFactorId) {
        // Create new risk factor
        const { data, error } = await supabase
          .from('risk_factors')
          .insert({
            auditable_area_id: id,
            financial_impact: field === 'financial_impact' ? value : riskFactors.financial_impact,
            legal_compliance_impact: field === 'legal_compliance_impact' ? value : riskFactors.legal_compliance_impact,
            strategic_significance: field === 'strategic_significance' ? value : riskFactors.strategic_significance,
            technological_cyber_impact: field === 'technological_cyber_impact' ? value : riskFactors.technological_cyber_impact,
            new_process_system: field === 'new_process_system' ? value : riskFactors.new_process_system,
            stakeholder_impact: field === 'stakeholder_impact' ? value : riskFactors.stakeholder_impact,
            c_level_concerns: field === 'c_level_concerns' ? value : riskFactors.c_level_concerns,
            erm_residual_risk: field === 'erm_residual_risk' ? value : riskFactors.erm_residual_risk,
          })
          .select()
          .single();

        if (error) throw error;
        riskFactorId = data.id;
      } else {
        // Update existing risk factor
        const { error } = await supabase
          .from('risk_factors')
          .update(updateData)
          .eq('id', riskFactorId);

        if (error) throw error;
      }

      // Fetch updated calculated values
      const { data: updated, error: fetchError } = await supabase
        .from('risk_factors')
        .select('*')
        .eq('id', riskFactorId)
        .single();

      if (fetchError) throw fetchError;

      if (updated) {
        setRiskFactors({
          id: updated.id,
          financial_impact: updated.financial_impact,
          legal_compliance_impact: updated.legal_compliance_impact,
          strategic_significance: updated.strategic_significance,
          technological_cyber_impact: updated.technological_cyber_impact,
          new_process_system: updated.new_process_system,
          stakeholder_impact: updated.stakeholder_impact,
          c_level_concerns: updated.c_level_concerns,
          inherent_risk_score: updated.inherent_risk_score,
          internal_audit_residual_risk: updated.internal_audit_residual_risk,
          erm_residual_risk: updated.erm_residual_risk,
          assurance_haircut: updated.assurance_haircut,
          combined_residual_risk: updated.combined_residual_risk,
          combined_residual_risk_level: updated.combined_residual_risk_level,
        });
      }

      toast.success('✅ Inherent risk recalculated successfully.');
    } catch (error) {
      console.error('Error updating risk factor:', error);
      toast.error('Failed to update risk factor');
      // Revert optimistic update on error
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleCoverageChange = async (providerType: 'InternalAudit' | 'ThirdParty', newLevel: CoverageLevel) => {
    if (!id) return;
    
    try {
      setSaving(true);
      
      // Optimistically update the UI immediately
      if (providerType === 'InternalAudit') {
        setIaCoverage(newLevel);
      } else {
        setTpCoverage(newLevel);
      }
      
      const coverageId = providerType === 'InternalAudit' ? iaCoverageId : tpCoverageId;
      
      if (coverageId) {
        // Update existing record
        const { error } = await supabase
          .from('assurance_coverage')
          .update({ coverage_level: newLevel })
          .eq('id', coverageId);
        
        if (error) throw error;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('assurance_coverage')
          .insert([{
            auditable_area_id: id,
            provider_type: providerType,
            coverage_level: newLevel,
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        if (providerType === 'InternalAudit') {
          setIaCoverageId(data.id);
        } else {
          setTpCoverageId(data.id);
        }
      }
      
      // Fetch updated risk factors to get recalculated values
      if (riskFactors.id) {
        const { data: updated, error: fetchError } = await supabase
          .from('risk_factors')
          .select('*')
          .eq('id', riskFactors.id)
          .single();
        
        if (fetchError) throw fetchError;
        
        if (updated) {
          setRiskFactors(prev => ({
            ...prev,
            assurance_haircut: updated.assurance_haircut,
            internal_audit_residual_risk: updated.internal_audit_residual_risk,
            combined_residual_risk: updated.combined_residual_risk,
            combined_residual_risk_level: updated.combined_residual_risk_level,
          }));
        }
      }
      
      toast.success('✅ All risk scores recalculated successfully.');
    } catch (error) {
      console.error('Error updating coverage:', error);
      toast.error('Failed to update assurance coverage');
      // Revert optimistic update on error
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const getRiskLevelColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'low':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const riskLevels: RiskLevel[] = ['Low', 'Medium', 'High'];
  const coverageLevels: CoverageLevel[] = ['Comprehensive', 'Moderate', 'Limited'];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!auditableArea) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="text-muted-foreground">Auditable area not found</div>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Calculator className="h-8 w-8" />
                Unified Risk Scoring
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 ml-12">
              Complete risk assessment for {auditableArea.name}
            </p>
          </div>
        </div>

        {/* Section 1: Header Info */}
        <Card>
          <CardHeader>
            <CardTitle>Auditable Area Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-semibold">{auditableArea.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Business Unit</Label>
                <p className="font-semibold">{auditableArea.business_unit}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Category</Label>
                <p className="font-semibold">{auditableArea.category}</p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="regulatory-req">Regulatory Requirement</Label>
                <p className="text-sm text-muted-foreground">
                  Mark if this area has regulatory compliance requirements
                </p>
              </div>
              <Switch
                id="regulatory-req"
                checked={auditableArea.regulatory_requirement}
                onCheckedChange={handleRegulatoryToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Risk Factor Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Factor Inputs</CardTitle>
            <CardDescription>
              Adjust risk levels to calculate inherent risk score automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Financial Impact</Label>
                <Select
                  value={riskFactors.financial_impact}
                  onValueChange={(value) => handleRiskFactorChange('financial_impact', value as RiskLevel)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Legal/Compliance Impact</Label>
                <Select
                  value={riskFactors.legal_compliance_impact}
                  onValueChange={(value) => handleRiskFactorChange('legal_compliance_impact', value as RiskLevel)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Strategic Significance</Label>
                <Select
                  value={riskFactors.strategic_significance}
                  onValueChange={(value) => handleRiskFactorChange('strategic_significance', value as RiskLevel)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tech/Cyber Impact</Label>
                <Select
                  value={riskFactors.technological_cyber_impact}
                  onValueChange={(value) => handleRiskFactorChange('technological_cyber_impact', value as RiskLevel)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>New Process/System</Label>
                <Select
                  value={riskFactors.new_process_system}
                  onValueChange={(value) => handleRiskFactorChange('new_process_system', value as RiskLevel)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Stakeholder Impact</Label>
                <Select
                  value={riskFactors.stakeholder_impact}
                  onValueChange={(value) => handleRiskFactorChange('stakeholder_impact', value as RiskLevel)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>C-Level Concerns</Label>
                <Select
                  value={riskFactors.c_level_concerns}
                  onValueChange={(value) => handleRiskFactorChange('c_level_concerns', value as RiskLevel)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="bg-muted/50 p-4 rounded-lg">
              <Label>Inherent Risk Score (Calculated)</Label>
              <p className="text-2xl font-bold mt-2">
                {riskFactors.inherent_risk_score != null 
                  ? riskFactors.inherent_risk_score.toFixed(2)
                  : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically calculated based on weighted risk factors
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Assurance Coverage */}
        <Card>
          <CardHeader>
            <CardTitle>Assurance Coverage Inputs</CardTitle>
            <CardDescription>
              Update coverage levels to calculate assurance haircut automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assurance by Internal Audit</Label>
                <Select
                  value={iaCoverage}
                  onValueChange={(value) => handleCoverageChange('InternalAudit', value as CoverageLevel)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {coverageLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assurance by Third Party</Label>
                <Select
                  value={tpCoverage}
                  onValueChange={(value) => handleCoverageChange('ThirdParty', value as CoverageLevel)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {coverageLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="bg-muted/50 p-4 rounded-lg">
              <Label>Assurance Coverage Haircut (Calculated)</Label>
              <p className="text-2xl font-bold mt-2">
                {riskFactors.assurance_haircut != null 
                  ? `${(riskFactors.assurance_haircut * 100).toFixed(1)}%`
                  : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Weighted combination of Internal Audit and Third Party coverage
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Residual Risk Calculations */}
        <Card>
          <CardHeader>
            <CardTitle>Residual Risk Calculations</CardTitle>
            <CardDescription>
              ERM risk is editable; other fields are calculated automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Internal Audit Residual Risk</Label>
                <div className="px-3 py-2 bg-muted rounded-md">
                  <Badge className={getRiskLevelColor(riskFactors.internal_audit_residual_risk)}>
                    {riskFactors.internal_audit_residual_risk}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calculated: Inherent Risk × (1 - Assurance Haircut)
                </p>
              </div>

              <div className="space-y-2">
                <Label>ERM Residual Risk (Editable)</Label>
                <Select
                  value={riskFactors.erm_residual_risk}
                  onValueChange={(value) => handleRiskFactorChange('erm_residual_risk', value as RiskLevel)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Manual input: Low=1, Medium=3, High=5
                </p>
              </div>

              <div className="space-y-2">
                <Label>Combined Residual Risk Score</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-lg font-semibold">
                  {riskFactors.combined_residual_risk != null 
                    ? riskFactors.combined_residual_risk.toFixed(2)
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  (0.8 × IA Residual) + (0.2 × ERM Residual)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Combined Residual Risk Level</Label>
                <div className="px-3 py-2 bg-muted rounded-md">
                  {riskFactors.combined_residual_risk_level && (
                    <Badge className={getRiskLevelColor(riskFactors.combined_residual_risk_level)}>
                      {riskFactors.combined_residual_risk_level}
                    </Badge>
                  )}
                  {!riskFactors.combined_residual_risk_level && 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  ≤2.0=Low, ≤3.5=Medium, &gt;3.5=High
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Summary Output */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              All calculated values for {auditableArea.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Inherent Risk Score</Label>
                <p className="text-xl font-bold">
                  {riskFactors.inherent_risk_score != null 
                    ? riskFactors.inherent_risk_score.toFixed(2)
                    : 'N/A'}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Assurance Haircut</Label>
                <p className="text-xl font-bold">
                  {riskFactors.assurance_haircut != null 
                    ? `${(riskFactors.assurance_haircut * 100).toFixed(1)}%`
                    : 'N/A'}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">IA Residual Risk</Label>
                <Badge className={getRiskLevelColor(riskFactors.internal_audit_residual_risk)}>
                  {riskFactors.internal_audit_residual_risk}
                </Badge>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">ERM Residual Risk</Label>
                <Badge className={getRiskLevelColor(riskFactors.erm_residual_risk)}>
                  {riskFactors.erm_residual_risk}
                </Badge>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Combined Residual Risk</Label>
                <p className="text-xl font-bold">
                  {riskFactors.combined_residual_risk != null 
                    ? riskFactors.combined_residual_risk.toFixed(2)
                    : 'N/A'}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Combined Risk Level</Label>
                {riskFactors.combined_residual_risk_level && (
                  <Badge className={getRiskLevelColor(riskFactors.combined_residual_risk_level)}>
                    {riskFactors.combined_residual_risk_level}
                  </Badge>
                )}
                {!riskFactors.combined_residual_risk_level && <p className="text-muted-foreground">N/A</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Regulatory Requirement</Label>
                <Badge variant={auditableArea.regulatory_requirement ? "default" : "outline"}>
                  {auditableArea.regulatory_requirement ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RiskScoring;
