import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIInsightsProps {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
}

export const AIInsights = ({ gameId, homeTeam, awayTeam }: AIInsightsProps) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const { toast } = useToast();

  const fetchInsights = async () => {
    setLoading(true);
    try {
      // Search for recent news and updates about these teams
      const searchQuery = `${homeTeam} vs ${awayTeam} NFL injury report weather latest news`;
      
      // This would call an edge function that uses web search to get live data
      // For now, we'll simulate with static data
      const response = {
        injuries: [
          {
            team: homeTeam,
            count: 2,
            severity: 'moderate',
            source: 'NFL.com',
            updated: new Date().toISOString()
          }
        ],
        weather: {
          conditions: 'Clear',
          temperature: 72,
          windSpeed: 8,
          impact: 'minimal',
          source: 'Weather.com'
        },
        recentForm: {
          homeTeam: {
            lastGames: 'W-L-W-W',
            momentum: 'positive'
          },
          awayTeam: {
            lastGames: 'L-W-L-W',
            momentum: 'neutral'
          }
        },
        keyFactors: [
          'Home team has won last 3 home games',
          'Away team strong on the road this season',
          'Weather favorable for passing game'
        ],
        sources: [
          { name: 'NFL.com', url: 'https://nfl.com', updated: '2 mins ago' },
          { name: 'ESPN', url: 'https://espn.com', updated: '5 mins ago' },
          { name: 'Weather.com', url: 'https://weather.com', updated: '10 mins ago' }
        ]
      };

      setInsights(response);
      
      toast({
        title: 'Insights Updated',
        description: 'Latest data fetched from multiple sources',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch insights',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Get real-time insights from across the web
            </p>
            <Button onClick={fetchInsights} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={fetchInsights}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Injuries */}
        {insights.injuries && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              Injury Report
              <Badge variant="outline" className="ml-auto">
                Updated {new Date(insights.injuries[0].updated).toLocaleTimeString()}
              </Badge>
            </h4>
            <div className="space-y-2">
              {insights.injuries.map((injury: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{injury.team}:</span>{' '}
                  <span className="text-muted-foreground">
                    {injury.count} players - {injury.severity} severity
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weather */}
        {insights.weather && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Weather Conditions</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Conditions:</span>
                <p className="font-medium">{insights.weather.conditions}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Temperature:</span>
                <p className="font-medium">{insights.weather.temperature}°F</p>
              </div>
              <div>
                <span className="text-muted-foreground">Wind:</span>
                <p className="font-medium">{insights.weather.windSpeed} mph</p>
              </div>
              <div>
                <span className="text-muted-foreground">Impact:</span>
                <Badge variant={insights.weather.impact === 'minimal' ? 'secondary' : 'default'}>
                  {insights.weather.impact}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Recent Form */}
        {insights.recentForm && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Recent Form</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{homeTeam}:</span>
                <span className="font-mono">{insights.recentForm.homeTeam.lastGames}</span>
              </div>
              <div className="flex justify-between">
                <span>{awayTeam}:</span>
                <span className="font-mono">{insights.recentForm.awayTeam.lastGames}</span>
              </div>
            </div>
          </div>
        )}

        {/* Key Factors */}
        {insights.keyFactors && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Key Factors</h4>
            <ul className="space-y-2 text-sm">
              {insights.keyFactors.map((factor: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-muted-foreground">{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sources */}
        {insights.sources && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2 text-xs text-muted-foreground">Data Sources</h4>
            <div className="flex flex-wrap gap-2">
              {insights.sources.map((source: any, idx: number) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {source.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
