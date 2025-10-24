import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OddsData {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY');
    if (!ODDS_API_KEY) {
      throw new Error('ODDS_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch NFL odds from The Odds API
    const oddsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal`
    );

    if (!oddsResponse.ok) {
      throw new Error(`Odds API error: ${oddsResponse.status}`);
    }

    const oddsData: OddsData[] = await oddsResponse.json();
    console.log(`Fetched odds for ${oddsData.length} games`);

    // Helper to calculate NFL week
    const calculateWeek = (gameDate: Date): number => {
      const year = gameDate.getFullYear();
      // NFL season starts first Thursday after Labor Day (first Monday of Sept)
      const septFirst = new Date(year, 8, 1); // Sept 1
      const laborDay = new Date(year, 8, 1 + ((8 - septFirst.getDay()) % 7));
      const seasonStart = new Date(laborDay.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      if (gameDate < seasonStart) return 0; // Preseason
      
      const diffTime = gameDate.getTime() - seasonStart.getTime();
      const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
      return Math.min(Math.max(diffWeeks + 1, 1), 18); // Weeks 1-18
    };

    // Process each game
    for (const game of oddsData) {
      const gameDate = new Date(game.commence_time);
      const season = gameDate.getFullYear();
      const week = calculateWeek(gameDate);

      // Upsert game
      const { error: gameError } = await supabase
        .from('games')
        .upsert({
          id: game.id,
          season,
          week,
          home_team: game.home_team,
          away_team: game.away_team,
          kickoff_time: game.commence_time,
          status: 'scheduled',
        }, { onConflict: 'id' });

      if (gameError) {
        console.error(`Error upserting game ${game.id}:`, gameError);
        continue;
      }

      // Process bookmaker odds
      for (const bookmaker of game.bookmakers) {
        for (const market of bookmaker.markets) {
          // Store odds snapshot
          const { error: oddsError } = await supabase
            .from('odds_snapshots')
            .insert({
              game_id: game.id,
              snapshot_time: new Date().toISOString(),
              bookmaker: bookmaker.key,
              market_type: market.key,
              odds_data: {
                outcomes: market.outcomes,
                last_update: market.last_update,
              },
            });

          if (oddsError) {
            console.error(`Error storing odds for ${game.id}:`, oddsError);
          }
        }
      }
    }

    // Update source registry
    await supabase
      .from('source_registry')
      .update({
        last_success: new Date().toISOString(),
        consecutive_failures: 0,
      })
      .eq('source_type', 'odds');

    return new Response(
      JSON.stringify({ 
        success: true,
        games_processed: oddsData.length,
        message: 'Odds ingestion completed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Odds ingestion error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Update source registry on failure
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('source_registry')
        .update({
          last_failure: new Date().toISOString(),
          consecutive_failures: supabase.rpc('increment_failures'),
        })
        .eq('source_type', 'odds');
    } catch (updateError) {
      console.error('Failed to update source registry:', updateError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});