import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OddsData {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string; // ISO (Odds API returns UTC ISO)
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: "h2h" | "spreads" | "totals" | string;
      last_update: string;
      outcomes: Array<{
        name: string; // team name or "Over"/"Under"
        price: number; // decimal odds
        point?: number; // spread or total
      }>;
    }>;
  }>;
}

// Utility: compute consensus by taking median across books
function median(nums: number[]): number | null {
  const arr = nums
    .filter((x) => Number.isFinite(x))
    .slice()
    .sort((a, b) => a - b);
  if (!arr.length) return null;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ODDS_API_KEY = Deno.env.get("ODDS_API_KEY");
    if (!ODDS_API_KEY) throw new Error("ODDS_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Fetch NFL odds from The Odds API (UTC ISO times)
    const oddsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal`,
    );
    if (!oddsResponse.ok) throw new Error(`Odds API error: ${oddsResponse.status}`);

    const oddsData: OddsData[] = await oddsResponse.json();
    console.log(`Fetched odds for ${oddsData.length} games`);

    // Helper: NFL week (same as your current)
    const calculateWeek = (gameDate: Date): number => {
      const year = gameDate.getFullYear();
      const septFirst = new Date(Date.UTC(year, 8, 1));
      const laborDay = new Date(Date.UTC(year, 8, 1 + ((8 - septFirst.getUTCDay()) % 7)));
      const seasonStart = new Date(laborDay.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (gameDate < seasonStart) return 0;
      const diffWeeks = Math.floor((gameDate.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return Math.min(Math.max(diffWeeks + 1, 1), 18);
    };

    for (const game of oddsData) {
      // Odds API commence_time is ISO UTC — normalize and store as canonical
      const startUtc = new Date(game.commence_time); // safe UTC
      const start_time_utc = startUtc.toISOString();
      const season = startUtc.getUTCFullYear();
      const week = calculateWeek(startUtc);

      // Fetch existing to detect schedule change
      const { data: existingGame } = await supabase
        .from("games")
        .select("id, start_time_utc")
        .eq("id", game.id)
        .maybeSingle();

      let schedule_change = false;
      if (existingGame?.start_time_utc) {
        const prev = new Date(existingGame.start_time_utc).getTime();
        const curr = startUtc.getTime();
        const deltaMin = Math.abs(curr - prev) / 60000;
        if (deltaMin > 5) schedule_change = true;
      }

      // Upsert game with canonical UTC field
      const { error: gameError } = await supabase.from("games").upsert(
        {
          id: game.id,
          season,
          week,
          home_team: game.home_team,
          away_team: game.away_team,
          kickoff_time: game.commence_time, // keep for backward compat
          start_time_utc, // canonical
          status: "scheduled",
          schedule_change,
          // venue_tz: null, // TODO: set via venue map if you have venue available
        },
        { onConflict: "id" },
      );
      if (gameError) {
        console.error(`Error upserting game ${game.id}:`, gameError);
        continue;
      }

      // Aggregate consensus per market across bookmakers
      const mlHome: number[] = [];
      const mlAway: number[] = [];
      const spreadPts: number[] = [];
      const spreadHomePrice: number[] = [];
      const spreadAwayPrice: number[] = [];
      const totalPts: number[] = [];
      const overPrice: number[] = [];
      const underPrice: number[] = [];

      for (const bookmaker of game.bookmakers) {
        for (const market of bookmaker.markets) {
          // Store raw snapshot for audit/history
          const { error: oddsError } = await supabase.from("odds_snapshots").insert({
            game_id: game.id,
            snapshot_time: new Date().toISOString(),
            bookmaker: bookmaker.key,
            market_type: market.key,
            odds_data: {
              outcomes: market.outcomes,
              last_update: market.last_update,
            },
          });
          if (oddsError) console.error(`Error storing odds for ${game.id}:`, oddsError);

          // Build consensus inputs
          if (market.key === "h2h") {
            const home = market.outcomes.find((o) => o.name === game.home_team);
            const away = market.outcomes.find((o) => o.name === game.away_team);
            if (home?.price) mlHome.push(home.price);
            if (away?.price) mlAway.push(away.price);
          } else if (market.key === "spreads") {
            // Typically two outcomes: home with negative point, away with positive
            const home = market.outcomes.find((o) => o.name === game.home_team);
            const away = market.outcomes.find((o) => o.name === game.away_team);
            if (home?.point != null && away?.point != null) {
              // choose the home point (negative for favorite)
              spreadPts.push(home.point);
            }
            if (home?.price) spreadHomePrice.push(home.price);
            if (away?.price) spreadAwayPrice.push(away.price);
          } else if (market.key === "totals") {
            const over = market.outcomes.find((o) => o.name.toLowerCase() === "over");
            const under = market.outcomes.find((o) => o.name.toLowerCase() === "under");
            if (over?.point != null) totalPts.push(over.point);
            if (over?.price) overPrice.push(over.price);
            if (under?.price) underPrice.push(under.price);
          }
        }
      }

      // Consensus medians (robust to outliers)
      const consensus = {
        ml_home: median(mlHome),
        ml_away: median(mlAway),
        spread: median(spreadPts),
        spread_home_price: median(spreadHomePrice),
        spread_away_price: median(spreadAwayPrice),
        total: median(totalPts),
        over_price: median(overPrice),
        under_price: median(underPrice),
      };

      // Upsert latest consensus for quick prediction access
      // Adjust to your schema if different
      const { error: latestErr } = await supabase.from("games_odds_latest").upsert(
        {
          game_id: game.id,
          updated_at: new Date().toISOString(),
          ...consensus,
        },
        { onConflict: "game_id" },
      );

      if (latestErr) {
        // If the table doesn't exist yet, just log; predictions can still derive from snapshots
        console.warn("games_odds_latest upsert warning:", latestErr.message || latestErr);
      }
    }

    // Update source registry
    await supabase
      .from("source_registry")
      .update({
        last_success: new Date().toISOString(),
        consecutive_failures: 0,
      })
      .eq("source_type", "odds");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Odds ingestion completed successfully",
        games_processed: oddsData.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Odds ingestion error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    // Best-effort failure bookkeeping
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      await supabase
        .from("source_registry")
        .update({
          last_failure: new Date().toISOString(),
          consecutive_failures: supabase.rpc("increment_failures"),
        })
        .eq("source_type", "odds");
    } catch (e) {
      console.error("Failed to update source registry:", e);
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
