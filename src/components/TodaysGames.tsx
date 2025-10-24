import { GameCard } from "./GameCard";
import { useTodaysGames } from "@/hooks/useGames";
import { Skeleton } from "./ui/skeleton";

export const TodaysGames = () => {
  const { data: games, isLoading } = useTodaysGames();

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

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Today's Games</h2>
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
      ) : games && games.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} {...formatGameForCard(game)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No games scheduled for today</p>
          <p className="text-sm text-muted-foreground mt-2">Check back later for upcoming games</p>
        </div>
      )}
    </section>
  );
};
