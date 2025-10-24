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

    // Get completed games with predictions and actual results
    const { data: completedGames, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'completed')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)
      .order('kickoff_time', { ascending: false })
      .limit(100);

    if (gamesError) {
      throw gamesError;
    }

    console.log(`Calibrating model on ${completedGames?.length || 0} completed games`);

    const calibrationResults: any[] = [];

    for (const game of completedGames || []) {
      // Get predictions for this game
      const { data: predictions } = await supabase
        .from('predictions')
        .select('*')
        .eq('game_id', game.id)
        .eq('market_type', 'moneyline');

      if (!predictions || predictions.length === 0) continue;

      const prediction = predictions[0];
      const predictedProb = prediction.predicted_value;
      
      // Calculate actual outcome (1 if home won, 0 if away won)
      const actualOutcome = (game.home_score || 0) > (game.away_score || 0) ? 1 : 0;
      
      // Calculate Brier score: (predicted_prob - actual_outcome)^2
      const brierScore = Math.pow(predictedProb - actualOutcome, 2);
      
      // Calculate log loss: -[y*log(p) + (1-y)*log(1-p)]
      const epsilon = 1e-15; // Prevent log(0)
      const clampedProb = Math.max(epsilon, Math.min(1 - epsilon, predictedProb));
      const logLoss = -(actualOutcome * Math.log(clampedProb) + 
                       (1 - actualOutcome) * Math.log(1 - clampedProb));

      // Calculate prediction error for spread
      const { data: spreadPreds } = await supabase
        .from('predictions')
        .select('*')
        .eq('game_id', game.id)
        .eq('market_type', 'spread');

      let spreadError = null;
      if (spreadPreds && spreadPreds.length > 0) {
        const predictedMargin = spreadPreds[0].predicted_value;
        const actualMargin = (game.home_score || 0) - (game.away_score || 0);
        spreadError = Math.abs(predictedMargin - actualMargin);
      }

      // Store evaluation
      const { error: evalError } = await supabase
        .from('evaluations')
        .insert({
          prediction_id: prediction.id,
          actual_value: actualOutcome,
          error: spreadError,
          brier_score: brierScore,
          log_loss: logLoss,
          evaluated_at: new Date().toISOString(),
        });

      if (evalError) {
        console.error(`Error storing evaluation for ${game.id}:`, evalError);
      } else {
        calibrationResults.push({
          game_id: game.id,
          brier_score: brierScore,
          log_loss: logLoss,
          spread_error: spreadError,
        });
      }
    }

    // Calculate aggregate metrics
    const avgBrier = calibrationResults.reduce((sum, r) => sum + r.brier_score, 0) / 
                     (calibrationResults.length || 1);
    const avgLogLoss = calibrationResults.reduce((sum, r) => sum + r.log_loss, 0) / 
                       (calibrationResults.length || 1);
    const avgSpreadError = calibrationResults
      .filter(r => r.spread_error !== null)
      .reduce((sum, r) => sum + r.spread_error, 0) / 
      (calibrationResults.filter(r => r.spread_error !== null).length || 1);

    // Calculate reliability curve (bucket predictions into bins)
    const bins = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const reliabilityCurve = bins.slice(0, -1).map((lower, idx) => {
      const upper = bins[idx + 1];
      const binPredictions = calibrationResults.filter(r => {
        // Get prediction for this result
        return r.predicted_prob >= lower && r.predicted_prob < upper;
      });

      return {
        predicted_prob: (lower + upper) / 2,
        actual_prob: binPredictions.length > 0 
          ? binPredictions.filter(p => p.actual_outcome === 1).length / binPredictions.length
          : null,
        count: binPredictions.length,
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        games_evaluated: completedGames?.length || 0,
        metrics: {
          avg_brier_score: avgBrier.toFixed(4),
          avg_log_loss: avgLogLoss.toFixed(4),
          avg_spread_error: avgSpreadError.toFixed(2),
          reliability_curve: reliabilityCurve,
        },
        message: 'Model calibration completed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Calibration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});