import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIInsightsProps {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
}

/**
 * Utility: robust time formatter.
 * Prefers a canonical UTC timestamp (start_time_utc) if present,
 * falls back to kickoff_time. Renders with timezone abbreviation.
 */
function formatDateTime(dt?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      ...(opts || {}),
    }).format(d);
  } catch {
    return "—";
  }
}

type GameRow = {
  id: string;
  venue?: string | null;
  status?: string | null;
  kickoff_time?: string | null; // legacy/local or unknown TZ
  start_time_utc?: string | null; // canonical UTC if your ingest writes this
  home_team: string;
  away_team: string;
  home_score?: number | null;
  away_score?: number | null;
};

type SignalRow = {
  signal_type: "injury" | "weather" | string;
  content: any;
  timestamp: string;
};

export const AIInsights = ({ gameId, homeTeam, awayTeam }: AIInsightsProps) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const { toast } = useToast();

  const fetchInsights = async () => {
    setLoading(true);
    try {
      toast({
        title: "Fetching Live Data",
        description: "Pulling latest injuries, weather, and odds...",
      });

      // 1) Trigger the pipeline refresh
      await supabase.functions.invoke("orchestrator");

      // 2) Give the pipeline a short moment (you can convert this to polling if needed)
      await new Promise((r) => setTimeout(r, 3000));

      // 3) Pull signals for this game
      const { data: signals, error: sigErr } = (await supabase
        .from("signals")
        .select("signal_type, content, timestamp")
        .eq("game_id", gameId)
        .order("timestamp", { ascending: false })) as { data: SignalRow[] | null; error: any };

      if (sigErr) console.warn("signals error:", sigErr);

      // 4) Pull the game row
      const { data: game, error: gameErr } = (await supabase
        .from("games")
        .select("id, venue, status, kickoff_time, start_time_utc, home_team, away_team, home_score, away_score")
        .eq("id", gameId)
        .single()) as { data: GameRow | null; error: any };

      if (gameErr) console.warn("games error:", gameErr);

      // 5) Recent form for each team (use canonical UTC field if available)
      const timeField = "start_time_utc"; // change to 'kickoff_time' if you don’t have start_time_utc yet

      const { data: homeRecentGames } = (await supabase
        .from("games")
        .select(`id, home_team, away_team, home_score, away_score, status, ${timeField}`)
        .or(`home_team.eq.${homeTeam},away_team.eq.${homeTeam}`)
        .neq("status", "scheduled")
        .order(timeField, { ascending: false })
        .limit(4)) as { data: GameRow[] | null };

      const { data: awayRecentGames } = (await supabase
        .from("games")
        .select(`id, home_team, away_team, home_score, away_score, status, ${timeField}`)
        .or(`home_team.eq.${awayTeam},away_team.eq.${awayTeam}`)
        .neq("status", "scheduled")
        .order(timeField, { ascending: false })
        .limit(4)) as { data: GameRow[] | null };

      // 6) Parse injuries from signals
      const injurySignals = (signals || []).filter((s) => s.signal_type === "injury");
      const injuries = injurySignals.map((signal) => {
        const content = signal.content || {};
        return {
          team: content.team || "Unknown",
          player: content.player || "Unknown",
          status: content.status || "Unknown",
          impact: content.severity || "Unknown",
          updated: signal.timestamp,
        };
      });

      // 7) Parse weather from signals (take newest)
      const weatherSignals = (signals || []).filter((s) => s.signal_type === "weather");
      const weatherContent = weatherSignals[0]?.content || null;
      const weather = weatherContent
        ? {
            conditions: weatherContent.conditions ?? "N/A",
            temperature: weatherContent.temperature ?? 0,
            windSpeed: weatherContent.wind_speed ?? 0,
            impact: weatherContent.impact ?? "Unknown",
          }
        : null;

      // 8) Build recent form strings
      const homeForm =
        homeRecentGames
          ?.map((g) =>
            g.home_team === homeTeam
              ? (g.home_score ?? 0) > (g.away_score ?? 0)
                ? "W"
                : "L"
              : (g.away_score ?? 0) > (g.home_score ?? 0)
                ? "W"
                : "L",
          )
          .join("-") || "N/A";

      const awayForm =
        awayRecentGames
          ?.map((g) =>
            g.home_team === awayTeam
              ? (g.home_score ?? 0) > (g.away_score ?? 0)
                ? "W"
                : "L"
              : (g.away_score ?? 0) > (g.home_score ?? 0)
                ? "W"
                : "L",
          )
          .join("-") || "N/A";

      // 9) Prefer UTC field for display
      const kickoffDisplay = useMemo(
        () => formatDateTime(game?.start_time_utc || game?.kickoff_time),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [game?.start_time_utc, game?.kickoff_time],
      );

      setInsights({
        injuries: injuries.length
          ? injuries
          : [
              {
                team: "N/A",
                player: "No injuries reported",
                status: "N/A",
                impact: "None",
                updated: new Date().toISOString(),
              },
            ],
        weather: weather || {
          conditions: "Data unavailable",
          temperature: 70,
          windSpeed: 0,
          impact: "Unknown",
        },
        recentForm: {
          homeTeam: { lastGames: homeForm, momentum: homeRecentGames?.length ? "Available" : "No data" },
          awayTeam: { lastGames: awayForm, momentum: awayRecentGames?.length ? "Available" : "No data" },
        },
        keyFactors: [
          `Kickoff: ${kickoffDisplay}`,
          `Venue: ${game?.venue || "TBD"}`,
          `${injurySignals.length} injury reports tracked`,
          `${signals?.length || 0} total data signals processed`,
          `Weather: ${weather?.conditions || "Unknown"} conditions`,
        ],
        sources: [
          { name: "The Odds API", url: "https://the-odds-api.com", updated: "Live" },
          { name: "ESPN Injury Reports", url: "https://espn.com/nfl/injuries", updated: "Live" },
          { name: "Weather.gov", url: "https://weather.gov", updated: "Live" },
        ],
      });

      toast({ title: "Insights Updated", description: "Latest data fetched from database" });
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast({ title: "Error", description: "Failed to fetch insights", variant: "destructive" });
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
            <p className="text-muted-foreground mb-4">Get real-time insights from live data sources</p>
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
          <Button size="sm" variant="ghost" onClick={fetchInsights} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Injuries */}
        {insights.injuries && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              Injury Report
              {insights.injuries[0].updated && (
                <Badge variant="outline" className="ml-auto">
                  Updated {formatDateTime(insights.injuries[0].updated, { hour: "numeric", minute: "2-digit" })}
                </Badge>
              )}
            </h4>
            <div className="space-y-2">
              {insights.injuries.map((injury: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{injury.team}:</span>{" "}
                  <span className="text-muted-foreground">
                    {injury.player} - {injury.status} ({injury.impact})
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
                <Badge variant={insights.weather.impact === "minimal" ? "secondary" : "default"}>
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
