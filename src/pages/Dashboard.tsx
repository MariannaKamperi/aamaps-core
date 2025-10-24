import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, AlertTriangle, Shield, FileText, Calculator } from 'lucide-react';
import { Layout } from '@/components/Layout';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAreas: 0,
    highRiskCount: 0,
    assuranceCoverage: 0,
    pendingAudits: 0,
  });
  const [recentAreas, setRecentAreas] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch total auditable areas
    const { count: totalAreas } = await supabase
      .from('auditable_areas')
      .select('*', { count: 'exact', head: true });

    // Fetch high risk areas
    const { count: highRiskCount } = await supabase
      .from('risk_factors')
      .select('*', { count: 'exact', head: true })
      .gte('inherent_risk_score', 4.0);

    // Fetch assurance coverage count
    const { count: assuranceCoverage } = await supabase
      .from('assurance_coverage')
      .select('*', { count: 'exact', head: true });

    // Fetch pending audits (areas without recent audit)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const { count: pendingAudits } = await supabase
      .from('auditable_areas')
      .select('*', { count: 'exact', head: true })
      .or(`last_audit_date.is.null,last_audit_date.lt.${oneYearAgo.toISOString()}`);

    // Fetch recent auditable areas
    const { data: areas } = await supabase
      .from('auditable_areas')
      .select(`
        id,
        name,
        business_unit,
        category,
        risk_factors!fk_risk_factors_auditable_area (
          combined_residual_risk_level
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    setStats({
      totalAreas: totalAreas || 0,
      highRiskCount: highRiskCount || 0,
      assuranceCoverage: assuranceCoverage || 0,
      pendingAudits: pendingAudits || 0,
    });

    setRecentAreas(areas || []);
  };

  const mockRiskHeatmap = [
    { businessUnit: 'Finance', low: 2, medium: 3, high: 1 },
    { businessUnit: 'IT', low: 1, medium: 2, high: 4 },
    { businessUnit: 'Operations', low: 3, medium: 2, high: 2 },
    { businessUnit: 'HR', low: 4, medium: 1, high: 0 },
    { businessUnit: 'Compliance', low: 1, medium: 3, high: 2 },
  ];

  const mockCoverageData = [
    { provider: 'Internal Audit', count: 12 },
    { provider: 'InfoSec', count: 8 },
    { provider: 'Compliance', count: 6 },
    { provider: 'Risk Mgmt', count: 5 },
    { provider: 'External Audit', count: 4 },
  ];

  const mockTrendData = [
    { month: 'Jan', avgRisk: 3.2 },
    { month: 'Feb', avgRisk: 3.4 },
    { month: 'Mar', avgRisk: 3.1 },
    { month: 'Apr', avgRisk: 3.5 },
    { month: 'May', avgRisk: 3.3 },
    { month: 'Jun', avgRisk: 3.0 },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your audit management system
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Auditable Areas
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAreas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                High Risk Areas
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-risk-high" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-risk-high">{stats.highRiskCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Assurance Coverage
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assuranceCoverage}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Audits
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAudits}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Areas Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access to Risk Scoring</CardTitle>
            <CardDescription>Select an auditable area to view and edit its complete risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAreas.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No auditable areas found</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Auditable Area</TableHead>
                      <TableHead>Business Unit</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAreas.map((area) => (
                      <TableRow key={area.id}>
                        <TableCell className="font-medium">{area.name}</TableCell>
                        <TableCell>{area.business_unit}</TableCell>
                        <TableCell>{area.category}</TableCell>
                        <TableCell>
                          {area.risk_factors?.[0]?.combined_residual_risk_level || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/risk-scoring/${area.id}`)}
                          >
                            <Calculator className="h-4 w-4 mr-2" />
                            Open Risk Scoring
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

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Risk Heatmap by Business Unit</CardTitle>
              <CardDescription>Distribution of risk levels across units</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockRiskHeatmap}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="businessUnit" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="low" fill="hsl(var(--risk-low))" name="Low Risk" />
                  <Bar dataKey="medium" fill="hsl(var(--risk-medium))" name="Medium Risk" />
                  <Bar dataKey="high" fill="hsl(var(--risk-high))" name="High Risk" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assurance Coverage Distribution</CardTitle>
              <CardDescription>Coverage by assurance provider type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockCoverageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="provider" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--secondary))" name="Coverage Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Risk Trend Over Time</CardTitle>
            <CardDescription>Average risk score trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgRisk" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Avg Risk Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;