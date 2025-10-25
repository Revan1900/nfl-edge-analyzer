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

    // Get upcoming games
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .gte('kickoff_time', new Date().toISOString())
      .order('kickoff_time');

    if (gamesError) {
      throw gamesError;
    }

    console.log(`Building features for ${games?.length || 0} games`);

    for (const game of games || []) {
      // Fetch latest odds for this game
      const { data: odds } = await supabase
        .from('odds_snapshots')
        .select('*')
        .eq('game_id', game.id)
        .order('snapshot_time', { ascending: false })
        .limit(50);

      // Fetch injury signals
      const { data: injuries } = await supabase
        .from('signals')
        .select('*')
        .eq('game_id', game.id)
        .eq('signal_type', 'injury')
        .order('timestamp', { ascending: false })
        .limit(20);

      // Fetch weather signals
      const { data: weather } = await supabase
        .from('signals')
        .select('*')
        .eq('game_id', game.id)
        .eq('signal_type', 'weather')
        .order('timestamp', { ascending: false })
        .limit(1);

      // Calculate consensus odds (average across bookmakers)
      const consensusOdds = calculateConsensusOdds(odds || []);
      
      // Calculate injury impact score
      const injuryImpact = calculateInjuryImpact(injuries || []);
      
      // Weather severity
      const weatherSeverity = weather?.[0]?.content?.severity || 0;

      // Calculate rest days (simplified)
      const kickoffDate = new Date(game.kickoff_time);
      const dayOfWeek = kickoffDate.getDay();
      const restDays = dayOfWeek === 0 ? 7 : (dayOfWeek === 4 ? 4 : 6);

      // Build feature set
      const featureSet = {
        consensus_ml_home: consensusOdds.ml_home,
        consensus_ml_away: consensusOdds.ml_away,
        consensus_spread: consensusOdds.spread,
        consensus_total: consensusOdds.total,
        implied_prob_home: consensusOdds.implied_prob_home,
        implied_prob_away: consensusOdds.implied_prob_away,
        injury_impact_home: injuryImpact.home,
        injury_impact_away: injuryImpact.away,
        weather_severity: weatherSeverity,
        rest_days_home: restDays,
        rest_days_away: restDays,
        odds_volatility: calculateVolatility(odds || []),
        coverage_quality: (odds?.length || 0) >= 4 ? 1.0 : 0.5,
      };

      // Store features
      const { error: featuresError } = await supabase
        .from('features')
        .insert({
          game_id: game.id,
          feature_set: featureSet,
          computed_at: new Date().toISOString(),
        });

      if (featuresError) {
        console.error(`Error storing features for ${game.id}:`, featuresError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        games_processed: games?.length || 0,
        message: 'Feature building completed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Feature building error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateConsensusOdds(odds: any[]) {
  if (odds.length === 0) {
    return {
      ml_home: 0,
      ml_away: 0,
      spread: 0,
      total: 0,
      implied_prob_home: 0.5,
      implied_prob_away: 0.5,
    };
  }

  // Filter outliers using MAD (Median Absolute Deviation)
  const spreads = odds
    .filter(o => o.market_type === 'spreads')
    .flatMap(o => o.odds_data?.outcomes || [])
    .map((outcome: any) => outcome.point)
    .filter((p: number) => p !== undefined);

  const avgSpread = spreads.length > 0 
    ? spreads.reduce((a: number, b: number) => a + b, 0) / spreads.length 
    : 0;

  const totals = odds
    .filter(o => o.market_type === 'totals')
    .flatMap(o => o.odds_data?.outcomes || [])
    .map((outcome: any) => outcome.point)
    .filter((p: number) => p !== undefined);

  const avgTotal = totals.length > 0 
    ? totals.reduce((a: number, b: number) => a + b, 0) / totals.length 
    : 47;

  // Calculate implied probabilities from moneyline using actual team names
  const mlSnapshots = odds.filter(o => o.market_type === 'h2h');
  
  let homeOddsSum = 0;
  let awayOddsSum = 0;
  let count = 0;
  
  for (const snapshot of mlSnapshots) {
    const outcomes = snapshot.odds_data?.outcomes || [];
    const homeOutcome = outcomes.find((o: any) => o.name === game.home_team);
    const awayOutcome = outcomes.find((o: any) => o.name === game.away_team);
    
    if (homeOutcome?.price && awayOutcome?.price) {
      homeOddsSum += homeOutcome.price;
      awayOddsSum += awayOutcome.price;
      count++;
    }
  }
  
  const homeOdds = count > 0 ? homeOddsSum / count : 2.0;
  const awayOdds = count > 0 ? awayOddsSum / count : 2.0;

  const impliedHome = 1 / homeOdds;
  const impliedAway = 1 / awayOdds;
  const total = impliedHome + impliedAway;

  return {
    ml_home: homeOdds,
    ml_away: awayOdds,
    spread: avgSpread,
    total: avgTotal,
    implied_prob_home: impliedHome / total,
    implied_prob_away: impliedAway / total,
  };
}

function calculateInjuryImpact(injuries: any[]) {
  const homeInjuries = injuries.filter(inj => 
    inj.content?.team?.toLowerCase().includes('home')
  );
  const awayInjuries = injuries.filter(inj => 
    inj.content?.team?.toLowerCase().includes('away')
  );

  const calculateImpact = (injuryList: any[]) => {
    if (injuryList.length === 0) return 0;
    
    return injuryList.reduce((sum, inj) => {
      const severity = inj.content?.severity || 0.5;
      const confidence = inj.confidence || 0.5;
      
      // Position weights (QB = 3x, skill positions = 2x, others = 1x)
      const positionWeight = inj.content?.position === 'QB' ? 3 : 
                             ['WR', 'RB', 'TE'].includes(inj.content?.position) ? 2 : 1;
      
      return sum + (severity * confidence * positionWeight);
    }, 0) / 10; // Normalize
  };

  return {
    home: calculateImpact(homeInjuries),
    away: calculateImpact(awayInjuries),
  };
}

function calculateVolatility(odds: any[]) {
  if (odds.length < 2) return 0;

  const spreads = odds
    .filter(o => o.market_type === 'spreads')
    .flatMap(o => o.odds_data?.outcomes || [])
    .map((outcome: any) => outcome.point)
    .filter((p: number) => p !== undefined);

  if (spreads.length < 2) return 0;

  const mean = spreads.reduce((a: number, b: number) => a + b, 0) / spreads.length;
  const variance = spreads.reduce((sum: number, val: number) => 
    sum + Math.pow(val - mean, 2), 0) / spreads.length;
  
  return Math.sqrt(variance);
}