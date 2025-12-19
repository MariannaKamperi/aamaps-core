import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CoverageLevel,
  getCoverageScore, 
  calculateResidualRisk, 
  calculateCombinedResidualRisk,
  getRiskLevelFromScore,
  getRiskLevelScore
} from '@/utils/riskCalculations';

interface AssuranceCoverageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coverageId: string;
  onSuccess?: () => void;
}

interface CoverageData {
  auditable_area_id: string;
  provider_type: 'InternalAudit' | 'ThirdParty';
  coverage_level: CoverageLevel;
}

export const AssuranceCoverageEditDialog = ({ open, onOpenChange, coverageId, onSuccess }: AssuranceCoverageEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CoverageData>({
    auditable_area_id: '',
    provider_type: 'InternalAudit',
    coverage_level: 'Moderate',
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, coverageId]);

  const fetchData = async () => {
    try {
      const { data: coverage, error: cError } = await supabase
        .from('assurance_coverage')
        .select('*')
        .eq('id', coverageId)
        .single();

      if (cError) throw cError;
      if (coverage) {
        setFormData({
          auditable_area_id: coverage.auditable_area_id,
          provider_type: coverage.provider_type,
          coverage_level: coverage.coverage_level,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assurance coverage data');
    }
  };

  const handleFieldChange = async (field: keyof CoverageData, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    if (field === 'coverage_level' || field === 'provider_type') {
      await recalculateAndUpdate(newFormData);
    }
  };

  const recalculateAndUpdate = async (data: CoverageData) => {
    try {
      setLoading(true);

      // 1️⃣ Convert coverage to haircut ratio
      const haircutRatio = getCoverageScore(data.coverage_level);

      // 2️⃣ Update assurance coverage table
      const { error: coverageError } = await supabase
        .from('assurance_coverage')
        .update({
          coverage_level: data.coverage_level,
          provider_type: data.provider_type,
        })
        .eq('id', coverageId);

      if (coverageError) throw coverageError;

      // 3️⃣ Get related risk factor for this auditable area
      const { data: riskFactor, error: rfError } = await supabase
        .from('risk_factors')
        .select('id, inherent_risk_score, erm_residual_risk')
        .eq('auditable_area_id', data.auditable_area_id)
        .single();

      if (rfError) {
        console.log('No risk factor found for this auditable area');
        toast.success('✅ Assurance coverage updated.');
        return;
      }

      if (riskFactor) {
        // 4️⃣ Recalculate residual risks
        const inherentRisk = riskFactor.inherent_risk_score || 0;
        const iaResidual = calculateResidualRisk(inherentRisk, haircutRatio);
        const ermResidualScore = getRiskLevelScore(riskFactor.erm_residual_risk || 'Medium');
        const combinedResidual = calculateCombinedResidualRisk(iaResidual, ermResidualScore);
        const combinedLevel = getRiskLevelFromScore(combinedResidual);
        const iaResidualLevel = getRiskLevelFromScore(iaResidual);

        await supabase
          .from('risk_factors')
          .update({
            assurance_haircut: haircutRatio,
            internal_audit_residual_risk: iaResidualLevel,
            combined_residual_risk: combinedResidual,
            combined_residual_risk_level: combinedLevel,
          })
          .eq('id', riskFactor.id);
      }

      toast.success('✅ Assurance & residual risk recalculated.');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating coverage:', error);
      toast.error('Failed to update assurance coverage');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  const coverageLevels: CoverageLevel[] = ['Limited', 'Moderate', 'Comprehensive'];
  const providerTypes: ('InternalAudit' | 'ThirdParty')[] = ['InternalAudit', 'ThirdParty'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Assurance Coverage</DialogTitle>
          <DialogDescription>
            Changes are saved automatically and trigger recalculation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Provider Type</Label>
            <Select
              value={formData.provider_type}
              onValueChange={(value) => handleFieldChange('provider_type', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providerTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'InternalAudit' ? 'Internal Audit' : 'Third Party'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Coverage Level</Label>
            <Select
              value={formData.coverage_level}
              onValueChange={(value) => handleFieldChange('coverage_level', value as CoverageLevel)}
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

          <div className="flex justify-end">
            <Button onClick={handleSave}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
