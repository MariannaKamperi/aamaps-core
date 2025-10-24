import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PriorityResult {
  id: string;
  name: string;
  business_unit: string;
  combined_residual_risk_level: string | null;
  assurance_haircut: number | null;
  priority_level: number | null;
  proposed_audit_year: number | null;
  regulatory_requirement: boolean;
}

const PriorityResults = () => {
  const [results, setResults] = useState<PriorityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('auditable_areas')
        .select(`
          id,
          name,
          business_unit,
          regulatory_requirement,
          priority_level,
          proposed_audit_year,
          risk_factors!fk_risk_factors_auditable_area (
            combined_residual_risk_level,
            assurance_haircut
          )
        `)
        .order('priority_level', { ascending: true, nullsFirst: false });

      if (error) throw error;

      const formattedData = (data || []).map(area => ({
        id: area.id,
        name: area.name,
        business_unit: area.business_unit,
        regulatory_requirement: area.regulatory_requirement || false,
        priority_level: area.priority_level,
        proposed_audit_year: area.proposed_audit_year,
        combined_residual_risk_level: area.risk_factors?.[0]?.combined_residual_risk_level || null,
        assurance_haircut: area.risk_factors?.[0]?.assurance_haircut || null,
      }));

      setResults(formattedData);
    } catch (error) {
      console.error('Error fetching priority results:', error);
      toast.error('Failed to load priority results');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateAll = async () => {
    try {
      setRecalculating(true);
      toast.loading('Recalculating priorities for all areas...');

      // Call the update_audit_priority function for each auditable area
      const { data: areas, error: fetchError } = await supabase
        .from('auditable_areas')
        .select('id');

      if (fetchError) throw fetchError;

      for (const area of areas || []) {
        const { error } = await supabase.rpc('update_audit_priority', {
          p_auditable_area_id: area.id
        });
        
        if (error) {
          console.error(`Error recalculating priority for ${area.id}:`, error);
        }
      }

      toast.dismiss();
      toast.success('✅ Audit priority and year recalculated for all areas');
      
      // Refresh the results
      await fetchResults();
    } catch (error) {
      toast.dismiss();
      console.error('Error recalculating priorities:', error);
      toast.error('Failed to recalculate priorities');
    } finally {
      setRecalculating(false);
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

  const getPriorityColor = (level: number) => {
    if (level <= 3) return 'bg-red-500/10 text-red-700 dark:text-red-400';
    if (level <= 6) return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    return 'bg-green-500/10 text-green-700 dark:text-green-400';
  };

  const getYearColor = (year: number) => {
    if (year === 2026) return 'bg-red-500/10 text-red-700 dark:text-red-400';
    if (year === 2027) return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
  };

  const filteredResults = results.filter(result => {
    if (filterYear !== 'all' && result.proposed_audit_year?.toString() !== filterYear) {
      return false;
    }
    if (filterRisk !== 'all' && result.combined_residual_risk_level?.toLowerCase() !== filterRisk) {
      return false;
    }
    return true;
  });

  const uniqueYears = [...new Set(results.map(r => r.proposed_audit_year).filter(Boolean))].sort();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-8 w-8" />
              Audit Priority Results
            </h1>
            <p className="text-muted-foreground mt-2">
              Automatically calculated audit priorities and proposed years
            </p>
          </div>
          <Button 
            onClick={handleRecalculateAll} 
            disabled={recalculating}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculate All
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Priority Matrix</CardTitle>
            <CardDescription>
              Filter and sort audit priorities based on risk level and proposed year
            </CardDescription>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Year:</label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueYears.map(year => (
                      <SelectItem key={year} value={year!.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Risk:</label>
                <Select value={filterRisk} onValueChange={setFilterRisk}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No priority results found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Auditable Area</TableHead>
                      <TableHead>Business Unit</TableHead>
                      <TableHead>Residual Risk</TableHead>
                      <TableHead>Assurance Haircut</TableHead>
                      <TableHead>Priority Level</TableHead>
                      <TableHead>Proposed Year</TableHead>
                      <TableHead>Regulatory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">
                          {result.name}
                        </TableCell>
                        <TableCell>{result.business_unit}</TableCell>
                        <TableCell>
                          {result.combined_residual_risk_level ? (
                            <Badge className={getRiskLevelColor(result.combined_residual_risk_level)}>
                              {result.combined_residual_risk_level}
                            </Badge>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {result.assurance_haircut != null 
                            ? `${(result.assurance_haircut * 100).toFixed(0)}%`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {result.priority_level != null ? (
                            <Badge className={getPriorityColor(result.priority_level)}>
                              Level {result.priority_level}
                            </Badge>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {result.proposed_audit_year != null ? (
                            <Badge className={getYearColor(result.proposed_audit_year)}>
                              {result.proposed_audit_year}
                            </Badge>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {result.regulatory_requirement ? (
                            <Badge variant="outline">Yes</Badge>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
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
    </Layout>
  );
};

export default PriorityResults;
