import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ModelMetrics {
  totalPredictions: number;
  totalEvaluations: number;
  avgBrierScore: number;
  avgLogLoss: number;
  avgError: number;
  accuracy: number;
}

interface SourceHealth {
  id: string;
  source_name: string;
  is_active: boolean;
  consecutive_failures: number;
  last_success: string | null;
  last_failure: string | null;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [recentEvaluations, setRecentEvaluations] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadModelMetrics(),
        loadSourceHealth(),
        loadRecentEvaluations(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModelMetrics = async () => {
    const { data: predictions } = await supabase
      .from('predictions')
      .select('id');

    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('brier_score, log_loss, error, actual_value');

    if (evaluations && evaluations.length > 0) {
      const avgBrier = evaluations.reduce((sum, e) => sum + (e.brier_score || 0), 0) / evaluations.length;
      const avgLoss = evaluations.reduce((sum, e) => sum + (e.log_loss || 0), 0) / evaluations.length;
      const avgErr = evaluations.reduce((sum, e) => sum + Math.abs(e.error || 0), 0) / evaluations.length;
      
      // Calculate accuracy (within 7 points for spread predictions)
      const accurate = evaluations.filter(e => Math.abs(e.error || 999) <= 7).length;
      const accuracy = (accurate / evaluations.length) * 100;

      setMetrics({
        totalPredictions: predictions?.length || 0,
        totalEvaluations: evaluations.length,
        avgBrierScore: avgBrier,
        avgLogLoss: avgLoss,
        avgError: avgErr,
        accuracy,
      });
    }
  };

  const loadSourceHealth = async () => {
    const { data } = await supabase
      .from('source_registry')
      .select('*')
      .order('consecutive_failures', { ascending: false });

    setSources(data || []);
  };

  const loadRecentEvaluations = async () => {
    const { data } = await supabase
      .from('evaluations')
      .select(`
        *,
        predictions:prediction_id (
          market_type,
          predicted_value,
          confidence,
          games:game_id (
            home_team,
            away_team
          )
        )
      `)
      .order('evaluated_at', { ascending: false })
      .limit(20);

    // Transform for chart
    const chartData = (data || []).map((e, idx) => ({
      index: idx,
      brierScore: e.brier_score || 0,
      error: Math.abs(e.error || 0),
    }));

    setRecentEvaluations(chartData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Observability Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalPredictions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.accuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Within 7 points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Brier Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgBrierScore.toFixed(3) || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Lower is better</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgError.toFixed(2) || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Points off</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">
            <TrendingUp className="w-4 h-4 mr-2" />
            Model Performance
          </TabsTrigger>
          <TabsTrigger value="health">
            <AlertTriangle className="w-4 h-4 mr-2" />
            System Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Recent Evaluation Metrics</CardTitle>
              <CardDescription>Last 20 predictions evaluated</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEvaluations.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={recentEvaluations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" label={{ value: 'Prediction', position: 'insideBottom', offset: -5 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="brierScore" stroke="#8884d8" name="Brier Score" />
                    <Line type="monotone" dataKey="error" stroke="#82ca9d" name="Absolute Error" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No evaluation data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Data Source Health</CardTitle>
              <CardDescription>Monitor the status of all data sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {source.is_active && source.consecutive_failures === 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                      <div>
                        <h3 className="font-semibold">{source.source_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last success: {source.last_success ? new Date(source.last_success).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={source.is_active ? 'default' : 'secondary'}>
                        {source.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {source.consecutive_failures > 0 && (
                        <Badge variant="destructive">
                          {source.consecutive_failures} failures
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
