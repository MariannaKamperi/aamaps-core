import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  RiskLevel, 
  CoverageLevel,
  calculateInherentRisk, 
  getCoverageScore, 
  calculateResidualRisk, 
  calculateCombinedResidualRisk,
  getRiskLevelFromScore,
  getRiskLevelScore
} from '@/utils/riskCalculations';

interface RiskFactorEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskFactorId: string;
  onSuccess?: () => void;
}

interface RiskFactorData {
  financial_impact: RiskLevel;
  legal_compliance_impact: RiskLevel;
  strategic_significance: RiskLevel;
  technological_cyber_impact: RiskLevel;
  new_process_system: RiskLevel;
  stakeholder_impact: RiskLevel;
  c_level_concerns: RiskLevel;
  erm_residual_risk: RiskLevel;
  inherent_risk_score?: number;
  internal_audit_residual_risk?: RiskLevel;
  combined_residual_risk?: number;
  combined_residual_risk_level?: RiskLevel;
  assurance_haircut?: number;
  auditable_area_id?: string;
}

export const RiskFactorEditDialog = ({ open, onOpenChange, riskFactorId, onSuccess }: RiskFactorEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RiskFactorData>({
    financial_impact: 'Medium',
    legal_compliance_impact: 'Medium',
    strategic_significance: 'Medium',
    technological_cyber_impact: 'Medium',
    new_process_system: 'Medium',
    stakeholder_impact: 'Medium',
    c_level_concerns: 'Medium',
    erm_residual_risk: 'Medium',
  });
  const [iaCoverage, setIaCoverage] = useState<CoverageLevel>('Limited');
  const [tpCoverage, setTpCoverage] = useState<CoverageLevel>('Limited');
  const [iaCoverageId, setIaCoverageId] = useState<string | null>(null);
  const [tpCoverageId, setTpCoverageId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, riskFactorId]);

  const fetchData = async () => {
    try {
      const { data: riskFactor, error: rfError } = await supabase
        .from('risk_factors')
        .select('*')
        .eq('id', riskFactorId)
        .single();

      if (rfError) throw rfError;
      if (riskFactor) {
        setFormData({
          financial_impact: riskFactor.financial_impact,
          legal_compliance_impact: riskFactor.legal_compliance_impact,
          strategic_significance: riskFactor.strategic_significance,
          technological_cyber_impact: riskFactor.technological_cyber_impact,
          new_process_system: riskFactor.new_process_system,
          stakeholder_impact: riskFactor.stakeholder_impact,
          c_level_concerns: riskFactor.c_level_concerns,
          erm_residual_risk: riskFactor.erm_residual_risk,
          inherent_risk_score: riskFactor.inherent_risk_score,
          internal_audit_residual_risk: riskFactor.internal_audit_residual_risk,
          combined_residual_risk: riskFactor.combined_residual_risk,
          combined_residual_risk_level: riskFactor.combined_residual_risk_level,
          auditable_area_id: riskFactor.auditable_area_id,
        });

        // Fetch assurance coverage
        const { data: coverages, error: covError } = await supabase
          .from('assurance_coverage')
          .select('*')
          .eq('auditable_area_id', riskFactor.auditable_area_id);

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
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load risk factor data');
    }
  };

  const handleChange = async (field: keyof RiskFactorData, value: RiskLevel) => {
    const updatedForm = { ...formData, [field]: value };
    setFormData(updatedForm);

    try {
      setLoading(true);

      // Calculate new inherent risk
      const inherentRisk = calculateInherentRisk(updatedForm);

      // Calculate haircut ratio from coverage
      const haircutRatio = (getCoverageScore(iaCoverage) + getCoverageScore(tpCoverage)) / 2;

      // Calculate residual risks
      const iaResidual = calculateResidualRisk(inherentRisk, haircutRatio);
      const ermResidualScore = getRiskLevelScore(updatedForm.erm_residual_risk);
      const combinedResidual = calculateCombinedResidualRisk(iaResidual, ermResidualScore);
      const combinedLevel = getRiskLevelFromScore(combinedResidual);
      const iaResidualLevel = getRiskLevelFromScore(iaResidual);

      // Save to Supabase
      const { error } = await supabase
        .from('risk_factors')
        .update({
          financial_impact: updatedForm.financial_impact,
          legal_compliance_impact: updatedForm.legal_compliance_impact,
          strategic_significance: updatedForm.strategic_significance,
          technological_cyber_impact: updatedForm.technological_cyber_impact,
          new_process_system: updatedForm.new_process_system,
          stakeholder_impact: updatedForm.stakeholder_impact,
          c_level_concerns: updatedForm.c_level_concerns,
          erm_residual_risk: updatedForm.erm_residual_risk,
          inherent_risk_score: inherentRisk,
          assurance_haircut: haircutRatio,
          internal_audit_residual_risk: iaResidualLevel,
          combined_residual_risk: combinedResidual,
          combined_residual_risk_level: combinedLevel,
        })
        .eq('id', riskFactorId);

      if (error) throw error;

      // Update local state with calculated values
      setFormData(prev => ({
        ...prev,
        inherent_risk_score: inherentRisk,
        assurance_haircut: haircutRatio,
        internal_audit_residual_risk: iaResidualLevel,
        combined_residual_risk: combinedResidual,
        combined_residual_risk_level: combinedLevel,
      }));

      toast.success('✅ Risk factor updated');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating risk factor:', error);
      toast.error('❌ Failed to save update');
    } finally {
      setLoading(false);
    }
  };

  const handleCoverageChange = async (providerType: 'InternalAudit' | 'ThirdParty', newLevel: CoverageLevel) => {
    try {
      setLoading(true);
      
      const coverageId = providerType === 'InternalAudit' ? iaCoverageId : tpCoverageId;
      
      if (coverageId) {
        const { error } = await supabase
          .from('assurance_coverage')
          .update({ coverage_level: newLevel })
          .eq('id', coverageId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('assurance_coverage')
          .insert([{
            auditable_area_id: formData.auditable_area_id!,
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
      
      // Update local coverage state
      const newIaCoverage = providerType === 'InternalAudit' ? newLevel : iaCoverage;
      const newTpCoverage = providerType === 'ThirdParty' ? newLevel : tpCoverage;
      
      if (providerType === 'InternalAudit') {
        setIaCoverage(newLevel);
      } else {
        setTpCoverage(newLevel);
      }

      // Recalculate residual risks with new coverage
      const inherentRisk = formData.inherent_risk_score || calculateInherentRisk(formData);
      const haircutRatio = (getCoverageScore(newIaCoverage) + getCoverageScore(newTpCoverage)) / 2;
      const iaResidual = calculateResidualRisk(inherentRisk, haircutRatio);
      const ermResidualScore = getRiskLevelScore(formData.erm_residual_risk);
      const combinedResidual = calculateCombinedResidualRisk(iaResidual, ermResidualScore);
      const combinedLevel = getRiskLevelFromScore(combinedResidual);
      const iaResidualLevel = getRiskLevelFromScore(iaResidual);

      // Update risk factors with new calculations
      await supabase
        .from('risk_factors')
        .update({
          assurance_haircut: haircutRatio,
          internal_audit_residual_risk: iaResidualLevel,
          combined_residual_risk: combinedResidual,
          combined_residual_risk_level: combinedLevel,
        })
        .eq('id', riskFactorId);

      setFormData(prev => ({
        ...prev,
        assurance_haircut: haircutRatio,
        internal_audit_residual_risk: iaResidualLevel,
        combined_residual_risk: combinedResidual,
        combined_residual_risk_level: combinedLevel,
      }));
      
      toast.success('✅ Assurance & residual risk recalculated');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating coverage:', error);
      toast.error('Failed to update assurance coverage');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    onOpenChange(false);
  };

  const riskLevels: RiskLevel[] = ['Low', 'Medium', 'High'];
  const coverageLevels: CoverageLevel[] = ['Comprehensive', 'Moderate', 'Limited'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Risk Factors</DialogTitle>
          <DialogDescription>
            Changes are saved automatically and trigger recalculation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { field: 'financial_impact', label: 'Financial Impact' },
              { field: 'legal_compliance_impact', label: 'Legal/Compliance Impact' },
              { field: 'strategic_significance', label: 'Strategic Significance' },
              { field: 'technological_cyber_impact', label: 'Tech/Cyber Impact' },
              { field: 'new_process_system', label: 'New Process/System' },
              { field: 'stakeholder_impact', label: 'Stakeholder Impact' },
              { field: 'c_level_concerns', label: 'C-Level Concerns' },
            ].map(({ field, label }) => (
              <div key={field} className="space-y-2">
                <Label>{label}</Label>
                <Select
                  value={formData[field as keyof RiskFactorData] as string}
                  onValueChange={(value) => handleChange(field as keyof RiskFactorData, value as RiskLevel)}
                  disabled={loading}
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
            ))}
          </div>

          <div className="pt-4 border-t">
            <Label className="text-sm font-semibold">Inherent Risk Score</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium mt-2">
              {formData.inherent_risk_score?.toFixed(2) || 'N/A'}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Assurance Coverage</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Internal Audit</Label>
                <Select
                  value={iaCoverage}
                  onValueChange={(value) => handleCoverageChange('InternalAudit', value as CoverageLevel)}
                  disabled={loading}
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
                <Label>Third Party</Label>
                <Select
                  value={tpCoverage}
                  onValueChange={(value) => handleCoverageChange('ThirdParty', value as CoverageLevel)}
                  disabled={loading}
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
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Residual Risks</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>IA Residual Risk</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {formData.internal_audit_residual_risk || 'N/A'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>ERM Residual Risk</Label>
                <Select
                  value={formData.erm_residual_risk}
                  onValueChange={(value) => handleChange('erm_residual_risk', value as RiskLevel)}
                  disabled={loading}
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
                <Label>Combined Residual Risk</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {formData.combined_residual_risk?.toFixed(2) || 'N/A'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Combined Risk Level</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {formData.combined_residual_risk_level || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleDone}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
