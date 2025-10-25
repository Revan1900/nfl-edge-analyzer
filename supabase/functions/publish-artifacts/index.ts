import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const next21Days = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

    // Fetch today's games (next 48 hours)
    const { data: todaysGames, error: todayError } = await supabase
      .from('games')
      .select('id, season, week, kickoff_time, home_team, away_team, venue, status')
      .gte('kickoff_time', now.toISOString())
      .lte('kickoff_time', next48Hours.toISOString())
      .order('kickoff_time', { ascending: true });

    if (todayError) throw todayError;

    // Fetch upcoming games (next 21 days)
    const { data: upcomingGames, error: upcomingError } = await supabase
      .from('games')
      .select('id, season, week, kickoff_time, home_team, away_team, venue, status')
      .gte('kickoff_time', now.toISOString())
      .lte('kickoff_time', next21Days.toISOString())
      .order('kickoff_time', { ascending: true });

    if (upcomingError) throw upcomingError;

    // Fetch odds snapshots for all games
    const allGameIds = [...new Set([
      ...(todaysGames || []).map(g => g.id),
      ...(upcomingGames || []).map(g => g.id)
    ])];

    const { data: oddsData, error: oddsError } = await supabase
      .from('odds_snapshots')
      .select('*')
      .in('game_id', allGameIds)
      .order('snapshot_time', { ascending: false });

    if (oddsError) throw oddsError;

    // Fetch predictions
    const { data: predictionsData, error: predictionsError } = await supabase
      .from('predictions')
      .select('*')
      .in('game_id', allGameIds)
      .order('predicted_at', { ascending: false });

    if (predictionsError) throw predictionsError;

    // Build odds_snapshots.json - latest odds per game/market
    const oddsSnapshots: Record<string, any> = {};
    (oddsData || []).forEach((odds) => {
      const key = `${odds.game_id}_${odds.market_type}`;
      if (!oddsSnapshots[key]) {
        oddsSnapshots[key] = {
          game_id: odds.game_id,
          market_type: odds.market_type,
          bookmaker: odds.bookmaker,
          snapshot_time: odds.snapshot_time,
          odds_data: odds.odds_data,
        };
      }
    });

    // Build predictions.json - latest predictions per game/market
    const predictions: Record<string, any> = {};
    (predictionsData || []).forEach((pred) => {
      const key = `${pred.game_id}_${pred.market_type}`;
      if (!predictions[key]) {
        predictions[key] = {
          game_id: pred.game_id,
          market_type: pred.market_type,
          predicted_value: pred.predicted_value,
          confidence: pred.confidence,
          model_probability: pred.model_probability,
          implied_probability: pred.implied_probability,
          edge_vs_implied: pred.edge_vs_implied,
          uncertainty_band: pred.uncertainty_band,
          predicted_at: pred.predicted_at,
        };
      }
    });

    // Build refresh_state.json
    const { data: lastOddsUpdate } = await supabase
      .from('odds_snapshots')
      .select('snapshot_time')
      .order('snapshot_time', { ascending: false })
      .limit(1);

    const { data: lastPredictionUpdate } = await supabase
      .from('predictions')
      .select('predicted_at')
      .order('predicted_at', { ascending: false })
      .limit(1);

    const { data: lastInjuryUpdate } = await supabase
      .from('signals')
      .select('timestamp')
      .eq('signal_type', 'injury')
      .order('timestamp', { ascending: false })
      .limit(1);

    const { data: lastWeatherUpdate } = await supabase
      .from('signals')
      .select('timestamp')
      .eq('signal_type', 'weather')
      .order('timestamp', { ascending: false })
      .limit(1);

    const nextRefreshEta = new Date(now.getTime() + 30 * 60 * 1000); // 30 min from now

    const refreshState = {
      last_success_utc: now.toISOString(),
      next_eta_utc: nextRefreshEta.toISOString(),
      panel_freshness: {
        odds: lastOddsUpdate?.[0]?.snapshot_time || null,
        injuries: lastInjuryUpdate?.[0]?.timestamp || null,
        weather: lastWeatherUpdate?.[0]?.timestamp || null,
        predictions: lastPredictionUpdate?.[0]?.predicted_at || null,
      }
    };

    // Store artifacts (in a real implementation, these would be uploaded to CDN/storage)
    // For now, we'll store them in a simple way that the frontend can access
    console.log('Generated artifacts:', {
      todays_games_count: todaysGames?.length || 0,
      upcoming_games_count: upcomingGames?.length || 0,
      odds_snapshots_count: Object.keys(oddsSnapshots).length,
      predictions_count: Object.keys(predictions).length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        artifacts: {
          todays_games: todaysGames || [],
          upcoming_games: upcomingGames || [],
          odds_snapshots: Object.values(oddsSnapshots),
          predictions: Object.values(predictions),
          refresh_state: refreshState,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Artifact publishing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
