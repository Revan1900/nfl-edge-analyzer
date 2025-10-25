import { GameCard } from "./GameCard";
import { useTodaysGames, useUpcomingGames } from "@/hooks/useGames";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const TodaysGames = () => {
  const { data: games, isLoading: loadingToday } = useTodaysGames();
  const { data: upcomingGames, isLoading: loadingUpcoming } = useUpcomingGames();
  
  // Fetch team stats
  const { data: teamStats } = useQuery({
    queryKey: ['team-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_stats')
        .select('*')
        .eq('season', new Date().getFullYear());
      
      if (error) throw error;
      
      // Create a lookup map
      const statsMap: Record<string, any> = {};
      data?.forEach(team => {
        statsMap[team.team_name] = team;
      });
      return statsMap;
    },
    refetchInterval: 60000,
  });
  
  const isLoading = loadingToday || loadingUpcoming;

  const formatGameForCard = (game: any) => {
    const mlPrediction = game.predictions?.find((p: any) => p.market_type === 'moneyline');
    const spreadPrediction = game.predictions?.find((p: any) => p.market_type === 'spread');
    
    // Get team stats
    const homeStats = teamStats?.[game.home_team];
    const awayStats = teamStats?.[game.away_team];
    
    // Calculate edge (difference between model prob and implied prob from odds)
    const modelProb = mlPrediction?.model_probability || mlPrediction?.predicted_value || 0.5;
    const impliedProb = mlPrediction?.implied_probability || 0.5;
    const edge = Math.abs((modelProb - impliedProb) * 100);

    return {
      id: game.id,
      homeTeam: `${game.home_team}${homeStats ? ` (${homeStats.wins}-${homeStats.losses}${homeStats.ties ? '-' + homeStats.ties : ''})` : ''}`,
      awayTeam: `${game.away_team}${awayStats ? ` (${awayStats.wins}-${awayStats.losses}${awayStats.ties ? '-' + awayStats.ties : ''})` : ''}`,
      homeProb: Math.round(modelProb * 100),
      awayProb: Math.round((1 - modelProb) * 100),
      spread: spreadPrediction?.predicted_value || 0,
      spreadProb: Math.round(modelProb * 100),
      edge: edge,
      kickoff: new Date(game.kickoff_time).toLocaleString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      confidence: (mlPrediction?.confidence || 0) > 0.75 ? 'High' as const : 'Medium' as const,
    };
  };

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Group upcoming games by week
  const groupGamesByWeek = (gamesList: any[]) => {
    const grouped: Record<number, any[]> = {};
    gamesList.forEach((game) => {
      if (!grouped[game.week]) {
        grouped[game.week] = [];
      }
      grouped[game.week].push(game);
    });
    return grouped;
  };

  const hasGamesToday = games && games.length > 0;
  const showUpcoming = !hasGamesToday && upcomingGames && upcomingGames.length > 0;
  const groupedUpcoming = showUpcoming ? groupGamesByWeek(upcomingGames) : {};

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {hasGamesToday ? "Today's Games" : "Upcoming Games"}
          </h2>
          <p className="text-muted-foreground">{today}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors">
            Edges ≥3%
          </button>
          <button className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
            High Confidence
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : hasGamesToday ? (
        <div className="grid md:grid-cols-2 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} {...formatGameForCard(game)} />
          ))}
        </div>
      ) : showUpcoming ? (
        <div className="space-y-8">
          {Object.entries(groupedUpcoming).map(([week, weekGames]) => (
            <div key={week}>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold text-foreground">Week {week}</h3>
                <Badge variant="outline">{weekGames.length} games</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {weekGames.map((game) => (
                  <GameCard key={game.id} {...formatGameForCard(game)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No games scheduled</p>
          <p className="text-sm text-muted-foreground mt-2">Check back later for upcoming games</p>
        </div>
      )}
    </section>
  );
};
