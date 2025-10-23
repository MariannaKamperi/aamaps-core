import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Edit, Sprout } from 'lucide-react';
import { toast } from 'sonner';
import { RiskFactorEditDialog } from '@/components/RiskFactorEditDialog';

interface RiskFactorItem {
  id: string;
  auditable_area_id: string;
  financial_impact: string;
  legal_compliance_impact: string;
  strategic_significance: string;
  inherent_risk_score: number | null;
  combined_residual_risk: number | null;
  combined_residual_risk_level: string | null;
  auditable_areas?: {
    name: string;
    business_unit: string;
  };
}

const RiskFactors = () => {
  const [riskFactors, setRiskFactors] = useState<RiskFactorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskFactors();
  }, []);

  const fetchRiskFactors = async () => {
    try {
      const { data, error } = await supabase
        .from('risk_factors')
        .select(`
          *,
          auditable_areas!fk_risk_factors_auditable_area (
            name,
            business_unit
          )
        `)
        .order('inherent_risk_score', { ascending: false, nullsFirst: false });

      if (error) throw error;

      setRiskFactors(data || []);
    } catch (error) {
      console.error('Error fetching risk factors:', error);
      toast.error('Failed to load risk factors');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTestData = async () => {
    try {
      toast.loading('Creating test data...');
      
      const { data, error } = await supabase.functions.invoke('seed-test-data', {
        method: 'POST'
      });

      if (error) throw error;

      toast.dismiss();
      toast.success('✅ Test data created successfully');
      
      // Refresh the risk factors list
      fetchRiskFactors();
    } catch (error) {
      toast.dismiss();
      console.error('Error seeding test data:', error);
      toast.error('Failed to create test data');
    }
  };

  const getRiskLevelColor = (level: string) => {
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-8 w-8" />
              Risk Factors
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage risk factors across auditable areas
            </p>
          </div>
          <Button onClick={handleSeedTestData} variant="outline">
            <Sprout className="h-4 w-4" />
            Seed Test Data
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>
              Click edit to update risk factors with automatic recalculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : riskFactors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No risk factors found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Auditable Area</TableHead>
                      <TableHead>Business Unit</TableHead>
                      <TableHead>Inherent Risk Score</TableHead>
                      <TableHead>Residual Risk Score</TableHead>
                      <TableHead>Residual Risk Level</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskFactors.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.auditable_areas?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {item.auditable_areas?.business_unit || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {item.inherent_risk_score !== null ? item.inherent_risk_score.toFixed(2) : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {item.combined_residual_risk !== null ? item.combined_residual_risk.toFixed(2) : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.combined_residual_risk_level && (
                            <Badge className={getRiskLevelColor(item.combined_residual_risk_level)}>
                              {item.combined_residual_risk_level}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(item.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editingId && (
        <RiskFactorEditDialog
          open={!!editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
          riskFactorId={editingId}
          onSuccess={fetchRiskFactors}
        />
      )}
    </Layout>
  );
};

export default RiskFactors;
