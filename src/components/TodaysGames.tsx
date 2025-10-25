import { GameCard } from "./GameCard";
import { useTodaysGames, useUpcomingGames } from "@/hooks/useGames";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";

export const TodaysGames = () => {
  const { data: games, isLoading: loadingToday } = useTodaysGames();
  const { data: upcomingGames, isLoading: loadingUpcoming } = useUpcomingGames();
  
  const isLoading = loadingToday || loadingUpcoming;

  const formatGameForCard = (game: any) => {
    const mlPrediction = game.predictions?.find((p: any) => p.market_type === 'moneyline');
    const spreadPrediction = game.predictions?.find((p: any) => p.market_type === 'spread');
    
    // Calculate edge (difference between model prob and implied prob from odds)
    const features = game.features?.[0]?.feature_set;
    const modelProb = mlPrediction?.predicted_value || 0.5;
    const impliedProb = features?.implied_prob_home || 0.5;
    const edge = Math.abs(modelProb - impliedProb) * 100;

    return {
      id: game.id,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      homeProb: Math.round((mlPrediction?.predicted_value || 0.5) * 100),
      awayProb: Math.round((1 - (mlPrediction?.predicted_value || 0.5)) * 100),
      spread: spreadPrediction?.predicted_value || 0,
      spreadProb: mlPrediction?.predicted_value ? Math.round(mlPrediction.predicted_value * 100) : 50,
      edge: edge,
      kickoff: new Date(game.kickoff_time).toLocaleTimeString('en-US', { 
        weekday: 'short', 
        hour: 'numeric', 
        minute: '2-digit' 
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
