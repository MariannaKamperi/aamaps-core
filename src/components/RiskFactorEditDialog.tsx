import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RiskLevel } from '@/utils/riskCalculations';

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
  internal_audit_residual_risk: RiskLevel;
  erm_residual_risk: RiskLevel;
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
    internal_audit_residual_risk: 'Medium',
    erm_residual_risk: 'Medium',
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, riskFactorId]);

  const fetchData = async () => {
    try {
      // Fetch risk factor data
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
          internal_audit_residual_risk: riskFactor.internal_audit_residual_risk,
          erm_residual_risk: riskFactor.erm_residual_risk,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load risk factor data');
    }
  };

  const handleFieldChange = async (field: keyof RiskFactorData, value: RiskLevel) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Automatically recalculate and update
    await recalculateAndUpdate(newFormData);
  };

  const recalculateAndUpdate = async (data: RiskFactorData) => {
    try {
      setLoading(true);

      // Update database - triggers will handle all calculations automatically
      const { error } = await supabase
        .from('risk_factors')
        .update({
          financial_impact: data.financial_impact,
          legal_compliance_impact: data.legal_compliance_impact,
          strategic_significance: data.strategic_significance,
          technological_cyber_impact: data.technological_cyber_impact,
          new_process_system: data.new_process_system,
          stakeholder_impact: data.stakeholder_impact,
          c_level_concerns: data.c_level_concerns,
        })
        .eq('id', riskFactorId);

      if (error) throw error;

      // Fetch updated values to show calculated residual risks
      const { data: updated, error: fetchError } = await supabase
        .from('risk_factors')
        .select('*')
        .eq('id', riskFactorId)
        .single();

      if (fetchError) throw fetchError;
      
      if (updated) {
        setFormData({
          ...data,
          internal_audit_residual_risk: updated.internal_audit_residual_risk,
          erm_residual_risk: updated.erm_residual_risk,
        });
      }

      toast.success('✅ Residual risks recalculated automatically.');
    } catch (error) {
      console.error('Error updating risk factor:', error);
      toast.error('Failed to update risk factor');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  const riskLevels: RiskLevel[] = ['Low', 'Medium', 'High'];

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
            <div className="space-y-2">
              <Label>Financial Impact</Label>
              <Select
                value={formData.financial_impact}
                onValueChange={(value) => handleFieldChange('financial_impact', value as RiskLevel)}
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
              <Label>Legal/Compliance Impact</Label>
              <Select
                value={formData.legal_compliance_impact}
                onValueChange={(value) => handleFieldChange('legal_compliance_impact', value as RiskLevel)}
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
              <Label>Strategic Significance</Label>
              <Select
                value={formData.strategic_significance}
                onValueChange={(value) => handleFieldChange('strategic_significance', value as RiskLevel)}
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
              <Label>Tech/Cyber Impact</Label>
              <Select
                value={formData.technological_cyber_impact}
                onValueChange={(value) => handleFieldChange('technological_cyber_impact', value as RiskLevel)}
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
              <Label>New Process/System</Label>
              <Select
                value={formData.new_process_system}
                onValueChange={(value) => handleFieldChange('new_process_system', value as RiskLevel)}
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
              <Label>Stakeholder Impact</Label>
              <Select
                value={formData.stakeholder_impact}
                onValueChange={(value) => handleFieldChange('stakeholder_impact', value as RiskLevel)}
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
              <Label>C-Level Concerns</Label>
              <Select
                value={formData.c_level_concerns}
                onValueChange={(value) => handleFieldChange('c_level_concerns', value as RiskLevel)}
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

          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Calculated Residual Risks</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Residual risks are system-calculated based on assurance coverage
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Internal Audit Residual Risk</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {formData.internal_audit_residual_risk}
                </div>
              </div>

              <div className="space-y-2">
                <Label>ERM Residual Risk</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {formData.erm_residual_risk}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
