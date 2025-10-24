import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock } from "lucide-react";

interface GameCardProps {
  homeTeam: string;
  awayTeam: string;
  homeProb: number;
  awayProb: number;
  spread: number;
  spreadProb: number;
  edge: number;
  kickoff: string;
  confidence: "Low" | "Medium" | "High";
}

export const GameCard = ({
  homeTeam,
  awayTeam,
  homeProb,
  awayProb,
  spread,
  spreadProb,
  edge,
  kickoff,
  confidence,
}: GameCardProps) => {
  const hasEdge = edge >= 3;
  
  return (
    <Card className="p-6 hover:shadow-elevated transition-all duration-300 hover:scale-[1.02] cursor-pointer border-border">
      <div className="space-y-4">
        {/* Teams and Probabilities */}
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">{awayTeam}</span>
              <span className="text-2xl font-bold text-primary">{homeProb}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">{homeTeam}</span>
              <span className="text-2xl font-bold text-primary">{awayProb}%</span>
            </div>
          </div>
        </div>

        {/* Spread Information */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-sm">
            <span className="text-muted-foreground">Spread:</span>
            <span className="font-semibold ml-2">{spread > 0 ? '+' : ''}{spread}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Cover:</span>
            <span className="font-semibold ml-2">{spreadProb}%</span>
          </div>
        </div>

        {/* Badges and Info */}
        <div className="flex flex-wrap gap-2 items-center">
          {hasEdge && (
            <Badge className="bg-secondary text-secondary-foreground shadow-glow">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{edge.toFixed(1)}% Edge
            </Badge>
          )}
          <Badge variant={confidence === "High" ? "default" : "outline"}>
            {confidence} Confidence
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground ml-auto">
            <Clock className="h-3 w-3 mr-1" />
            {kickoff}
          </div>
        </div>
      </div>
    </Card>
  );
};
