import { GameCard } from "./GameCard";

// Mock data for demonstration
const mockGames = [
  {
    id: 1,
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Buffalo Bills",
    homeProb: 54,
    awayProb: 46,
    spread: -2.5,
    spreadProb: 52,
    edge: 4.2,
    kickoff: "Sun 4:25 PM",
    confidence: "High" as const,
  },
  {
    id: 2,
    homeTeam: "San Francisco 49ers",
    awayTeam: "Dallas Cowboys",
    homeProb: 61,
    awayProb: 39,
    spread: -6.5,
    spreadProb: 58,
    edge: 2.1,
    kickoff: "Sun 8:20 PM",
    confidence: "Medium" as const,
  },
  {
    id: 3,
    homeTeam: "Miami Dolphins",
    awayTeam: "New England Patriots",
    homeProb: 48,
    awayProb: 52,
    spread: 1.5,
    spreadProb: 49,
    edge: 0.8,
    kickoff: "Sun 1:00 PM",
    confidence: "Medium" as const,
  },
  {
    id: 4,
    homeTeam: "Green Bay Packers",
    awayTeam: "Minnesota Vikings",
    homeProb: 58,
    awayProb: 42,
    spread: -4.5,
    spreadProb: 55,
    edge: 5.3,
    kickoff: "Sun 1:00 PM",
    confidence: "High" as const,
  },
];

export const TodaysGames = () => {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Today's Games</h2>
          <p className="text-muted-foreground">Week 8 • Sunday, October 27, 2024</p>
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

      <div className="grid md:grid-cols-2 gap-6">
        {mockGames.map((game) => (
          <GameCard key={game.id} {...game} />
        ))}
      </div>
    </section>
  );
};
