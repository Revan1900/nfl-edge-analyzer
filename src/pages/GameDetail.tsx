import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '@/hooks/useGames';
import { useSaveSelection } from '@/hooks/useUserData';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Cloud, Activity, AlertCircle } from 'lucide-react';

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: game, isLoading } = useGame(gameId!);
  const saveSelection = useSaveSelection();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <p className="text-muted-foreground">Game not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  const mlPrediction = game.predictions?.find(p => p.market_type === 'moneyline');
  const spreadPrediction = game.predictions?.find(p => p.market_type === 'spread');
  const totalPrediction = game.predictions?.find(p => p.market_type === 'total');

  const injuries = game.signals?.filter(s => s.signal_type === 'injury') || [];
  const weather = game.signals?.find(s => s.signal_type === 'weather');
  const latestOdds = game.odds_snapshots?.slice(0, 5) || [];

  const handleSaveSelection = (marketType: string, side: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    saveSelection.mutate({
      game_id: game.id,
      market_type: marketType,
      selected_side: side,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>

        {/* Game Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">
                  {game.away_team} @ {game.home_team}
                </CardTitle>
                <p className="text-muted-foreground">
                  {new Date(game.kickoff_time).toLocaleString()} • {game.venue}
                </p>
              </div>
              <Badge variant={mlPrediction && mlPrediction.confidence > 0.75 ? 'default' : 'secondary'}>
                {mlPrediction ? `${(mlPrediction.confidence * 100).toFixed(0)}% Confidence` : 'No prediction'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="odds">Odds & Markets</TabsTrigger>
            <TabsTrigger value="factors">Key Factors</TabsTrigger>
            <TabsTrigger value="injuries">Injuries</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Model Predictions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Model Predictions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mlPrediction && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{game.home_team} Win Probability</span>
                      <span className="text-2xl font-bold">
                        {(mlPrediction.predicted_value * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{game.away_team} Win Probability</span>
                      <span>{((1 - mlPrediction.predicted_value) * 100).toFixed(1)}%</span>
                    </div>
                    {user && (
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSaveSelection('moneyline', game.home_team)}
                        >
                          Save {game.home_team}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSaveSelection('moneyline', game.away_team)}
                        >
                          Save {game.away_team}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {spreadPrediction && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Predicted Spread</span>
                      <span className="text-xl font-bold">
                        {spreadPrediction.predicted_value > 0 ? '+' : ''}
                        {spreadPrediction.predicted_value.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}

                {totalPrediction && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Predicted Total</span>
                      <span className="text-xl font-bold">
                        {totalPrediction.predicted_value.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weather */}
            {weather && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Weather Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Temperature</p>
                      <p className="text-lg font-semibold">
                        {weather.content.temperature}°F
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Wind Speed</p>
                      <p className="text-lg font-semibold">
                        {weather.content.windspeed} mph
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Precipitation</p>
                      <p className="text-lg font-semibold">
                        {weather.content.precipitation}"
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Severity</p>
                      <Badge variant={weather.content.severity > 0.5 ? 'destructive' : 'secondary'}>
                        {(weather.content.severity * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="odds">
            <Card>
              <CardHeader>
                <CardTitle>Latest Odds</CardTitle>
              </CardHeader>
              <CardContent>
                {latestOdds.length > 0 ? (
                  <div className="space-y-4">
                    {latestOdds.map((odds, idx) => (
                      <div key={odds.id} className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">{odds.bookmaker}</span>
                        <span className="text-sm text-muted-foreground">
                          {odds.market_type}
                        </span>
                        <span className="text-sm">
                          {new Date(odds.snapshot_time).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No odds data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="factors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Key Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Home Field Advantage</h4>
                    <p className="text-sm text-muted-foreground">
                      Model accounts for historical home field advantage at {game.venue}
                    </p>
                  </div>
                  {injuries.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Injury Impact</h4>
                      <p className="text-sm text-muted-foreground">
                        {injuries.length} reported injuries affecting prediction confidence
                      </p>
                    </div>
                  )}
                  {weather && weather.content.severity > 0.3 && (
                    <div>
                      <h4 className="font-semibold mb-2">Weather Impact</h4>
                      <p className="text-sm text-muted-foreground">
                        Adverse weather conditions may impact scoring and play style
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="injuries">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Injury Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                {injuries.length > 0 ? (
                  <div className="space-y-4">
                    {injuries.map((injury) => (
                      <div key={injury.id} className="border-b pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{injury.content.player}</p>
                            <p className="text-sm text-muted-foreground">
                              {injury.content.position} • {injury.content.status}
                            </p>
                            <p className="text-sm">{injury.content.injury_type}</p>
                          </div>
                          <Badge variant="secondary">
                            {injury.content.severity ? 
                              `${(injury.content.severity * 100).toFixed(0)}% severity` : 
                              'Unknown'
                            }
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No injuries reported</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default GameDetail;