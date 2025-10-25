import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create SHA-256 hash
async function createHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get games with features
    const { data: features, error: featuresError } = await supabase
      .from('features')
      .select('*, games(*)')
      .order('computed_at', { ascending: false });

    if (featuresError) {
      throw featuresError;
    }

    console.log(`Generating predictions for ${features?.length || 0} games`);

    for (const feature of features || []) {
      const game = feature.games;
      if (!game) continue;

      const fs = feature.feature_set;
      
      // Moneyline prediction using logistic regression (simplified)
      const homeAdvantage = 0.55; // Home field advantage
      const spreadAdjustment = fs.consensus_spread / 14; // Normalize spread
      const injuryAdjustment = (fs.injury_impact_away - fs.injury_impact_home) * 0.1;
      const weatherAdjustment = fs.weather_severity * -0.05;

      let homeProbability = homeAdvantage + spreadAdjustment + injuryAdjustment + weatherAdjustment;
      
      // Blend with implied probabilities (soft covariate)
      homeProbability = (homeProbability * 0.6) + (fs.implied_prob_home * 0.4);
      
      // Clamp between 0.02 and 0.98
      homeProbability = Math.max(0.02, Math.min(0.98, homeProbability));
      
      const awayProbability = 1 - homeProbability;

      // Calculate confidence based on coverage and volatility
      let confidence = fs.coverage_quality;
      if (fs.odds_volatility > 1.5) confidence *= 0.8; // Reduce confidence for volatile lines
      confidence = Math.max(0.1, Math.min(1.0, confidence));

      // Calculate uncertainty band
      const uncertaintyBand = {
        lower: Math.max(0, homeProbability - (0.1 * (1 - confidence))),
        upper: Math.min(1, homeProbability + (0.1 * (1 - confidence))),
      };

      // Spread prediction (margin of victory)
      const predictedMargin = (homeProbability - 0.5) * 28; // Scale to ±14 points
      
      // Total prediction
      const baseTotal = fs.consensus_total;
      const weatherImpact = fs.weather_severity * -3; // Bad weather reduces scoring
      const predictedTotal = baseTotal + weatherImpact;

      // Generate provenance hash for reproducibility
      const provenanceData = JSON.stringify({
        features: fs,
        timestamp: new Date().toISOString(),
        model_version: '1.0.0',
      });
      const provenanceHash = await createHash(provenanceData);

      // Store predictions
      const predictions = [
        {
          game_id: game.id,
          market_type: 'moneyline',
          predicted_value: homeProbability,
          confidence,
          uncertainty_band: uncertaintyBand,
          model_version: '1.0.0',
          provenance_hash: provenanceHash,
        },
        {
          game_id: game.id,
          market_type: 'spread',
          predicted_value: predictedMargin,
          confidence,
          uncertainty_band: {
            lower: predictedMargin - 7,
            upper: predictedMargin + 7,
          },
          model_version: '1.0.0',
          provenance_hash: provenanceHash,
        },
        {
          game_id: game.id,
          market_type: 'total',
          predicted_value: predictedTotal,
          confidence,
          uncertainty_band: {
            lower: predictedTotal - 6,
            upper: predictedTotal + 6,
          },
          model_version: '1.0.0',
          provenance_hash: provenanceHash,
        },
      ];

      // Fetch odds for this game to calculate implied probabilities and edge
      const { data: oddsData } = await supabase
        .from('odds_snapshots')
        .select('*')
        .eq('game_id', game.id)
        .eq('market_type', 'h2h')
        .order('snapshot_time', { ascending: false })
        .limit(5);

      let modelProbHome = homeProbability;
      let impliedProbHome = homeProbability;
      let edgeVsImplied = 0;

      if (oddsData && oddsData.length > 0) {
        // Average across multiple bookmakers
        let sumImpliedProb = 0;
        let count = 0;

        for (const snapshot of oddsData) {
          const odds = snapshot.odds_data as any;
          if (odds && odds.outcomes && Array.isArray(odds.outcomes)) {
            const homeOutcome = odds.outcomes.find((o: any) => 
              o.name === game.home_team
            );
            
            if (homeOutcome && homeOutcome.price) {
              // Convert decimal odds to implied probability (remove vig approximation)
              const impliedProb = 1 / homeOutcome.price;
              sumImpliedProb += impliedProb;
              count++;
            }
          }
        }

        if (count > 0) {
          impliedProbHome = sumImpliedProb / count;
          edgeVsImplied = (modelProbHome - impliedProbHome) * 100;
        }
      }

      // Store predictions with upsert
      const enhancedPredictions = [
        {
          game_id: game.id,
          market_type: 'moneyline',
          predicted_value: homeProbability,
          confidence,
          uncertainty_band: uncertaintyBand,
          model_version: '2.0.0',
          provenance_hash: provenanceHash,
          model_probability: modelProbHome,
          implied_probability: impliedProbHome,
          edge_vs_implied: edgeVsImplied,
        },
        {
          game_id: game.id,
          market_type: 'spread',
          predicted_value: predictedMargin,
          confidence,
          uncertainty_band: {
            lower: predictedMargin - 7,
            upper: predictedMargin + 7,
          },
          model_version: '2.0.0',
          provenance_hash: provenanceHash,
          model_probability: homeProbability,
          implied_probability: impliedProbHome,
          edge_vs_implied: edgeVsImplied,
        },
        {
          game_id: game.id,
          market_type: 'total',
          predicted_value: predictedTotal,
          confidence,
          uncertainty_band: {
            lower: predictedTotal - 6,
            upper: predictedTotal + 6,
          },
          model_version: '2.0.0',
          provenance_hash: provenanceHash,
          model_probability: null,
          implied_probability: null,
          edge_vs_implied: null,
        },
      ];

      const { error: predError } = await supabase
        .from('predictions')
        .upsert(enhancedPredictions, { 
          onConflict: 'game_id,market_type'
        });

      if (predError) {
        console.error(`Error storing predictions for ${game.id}:`, predError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        games_processed: features?.length || 0,
        message: 'Predictions generated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Prediction generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});