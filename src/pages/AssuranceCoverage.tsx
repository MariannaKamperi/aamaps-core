import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

type ProviderType = 'InternalAudit' | 'ThirdParty' | 'all';
type CoverageLevel = 'Limited' | 'Moderate' | 'Comprehensive';

interface AssuranceCoverageItem {
  id: string;
  auditable_area_id: string;
  provider_type: 'InternalAudit' | 'ThirdParty';
  coverage_level: CoverageLevel;
  assurance_score: number | null;
  last_assurance_date: string | null;
  comments: string | null;
  weight: number | null;
  auditable_areas?: {
    name: string;
    business_unit: string;
  };
}

const AssuranceCoverage = () => {
  const [coverageData, setCoverageData] = useState<AssuranceCoverageItem[]>([]);
  const [filteredData, setFilteredData] = useState<AssuranceCoverageItem[]>([]);
  const [providerFilter, setProviderFilter] = useState<ProviderType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoverageData();
  }, []);

  useEffect(() => {
    filterData();
  }, [providerFilter, coverageData]);

  const fetchCoverageData = async () => {
    try {
      const { data, error } = await supabase
        .from('assurance_coverage')
        .select(`
          *,
          auditable_areas!auditable_area_id (
            name,
            business_unit
          )
        `)
        .order('last_assurance_date', { ascending: false, nullsFirst: false });

      if (error) throw error;

      setCoverageData(data || []);
    } catch (error) {
      console.error('Error fetching coverage data:', error);
      toast.error('Failed to load assurance coverage data');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (providerFilter === 'all') {
      setFilteredData(coverageData);
    } else {
      setFilteredData(coverageData.filter(item => item.provider_type === providerFilter));
    }
  };

  const getCoverageLevelColor = (level: CoverageLevel) => {
    switch (level) {
      case 'Comprehensive':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'Moderate':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'Limited':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getProviderTypeLabel = (type: 'InternalAudit' | 'ThirdParty') => {
    return type === 'InternalAudit' ? 'Internal Audit' : 'Third Party';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Assurance Coverage
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage assurance coverage across auditable areas
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Coverage Records</CardTitle>
                <CardDescription>
                  Filter by provider type to view specific assurance coverage
                </CardDescription>
              </div>
              <Select
                value={providerFilter}
                onValueChange={(value) => setProviderFilter(value as ProviderType)}
              >
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="InternalAudit">Internal Audit</SelectItem>
                  <SelectItem value="ThirdParty">Third Party</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No assurance coverage records found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Auditable Area</TableHead>
                      <TableHead>Business Unit</TableHead>
                      <TableHead>Provider Type</TableHead>
                      <TableHead>Coverage Level</TableHead>
                      <TableHead>Assurance Score</TableHead>
                      <TableHead>Last Assurance Date</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.auditable_areas?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {item.auditable_areas?.business_unit || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getProviderTypeLabel(item.provider_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCoverageLevelColor(item.coverage_level)}>
                            {item.coverage_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.assurance_score !== null ? item.assurance_score.toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(item.last_assurance_date)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {item.comments || '-'}
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

export default AssuranceCoverage;
