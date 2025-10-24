import { useHistoricalMetrics } from '@/hooks/useGames';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, Target, BarChart3, DollarSign } from 'lucide-react';

const Historical = () => {
  const { data: metrics, isLoading } = useHistoricalMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Prepare reliability data (bucketed predictions vs actual outcomes)
  const reliabilityData = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(bucket => {
    const inBucket = metrics?.evaluations.filter(e => {
      const pred = e.predictions?.predicted_value;
      return pred && pred >= bucket - 0.05 && pred < bucket + 0.05;
    }) || [];

    const actualRate = inBucket.length > 0
      ? inBucket.filter(e => e.actual_value === 1).length / inBucket.length
      : null;

    return {
      predicted: bucket,
      actual: actualRate,
      count: inBucket.length,
    };
  }).filter(d => d.count > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Historical Performance</h1>
          <p className="text-muted-foreground">
            Model accuracy and calibration metrics based on {metrics?.totalPredictions || 0} predictions
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((metrics?.accuracy || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Predictions within 10% of actual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Brier Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics?.avgBrier || 0).toFixed(3)}
              </div>
              <p className="text-xs text-muted-foreground">
                Lower is better (0-1 scale)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Log Loss</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics?.avgLogLoss || 0).toFixed(3)}
              </div>
              <p className="text-xs text-muted-foreground">
                Probability calibration metric
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Spread Error</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics?.avgError || 0).toFixed(1)} pts
              </div>
              <p className="text-xs text-muted-foreground">
                Mean absolute error on spreads
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reliability Diagram */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Reliability Curve</CardTitle>
            <CardDescription>
              How well predicted probabilities match actual outcomes (perfect calibration = diagonal line)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="predicted" 
                  name="Predicted Probability"
                  domain={[0, 1]}
                  label={{ value: 'Predicted Probability', position: 'bottom' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="actual" 
                  name="Actual Rate"
                  domain={[0, 1]}
                  label={{ value: 'Actual Rate', angle: -90, position: 'left' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter 
                  name="Model Predictions" 
                  data={reliabilityData} 
                  fill="hsl(var(--primary))"
                />
                {/* Perfect calibration line */}
                <Line 
                  type="linear" 
                  dataKey="predicted" 
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  dot={false}
                  data={[{ predicted: 0 }, { predicted: 1 }]}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>
              Recent prediction accuracy and error metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={metrics?.evaluations.slice(0, 50).reverse() || []}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="evaluated_at" hide />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="brier_score" 
                  stroke="hsl(var(--primary))" 
                  name="Brier Score"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Historical;