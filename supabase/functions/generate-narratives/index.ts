import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

// Budget management state
let tokenBudgetUsed = 0;
const MAX_DAILY_TOKENS = 100000;
const ECONOMY_MODE_THRESHOLD = 0.8;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if we're in economy mode
    const economyMode = tokenBudgetUsed > (MAX_DAILY_TOKENS * ECONOMY_MODE_THRESHOLD);

    // Get games with predictions
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select(`
        *,
        predictions(*),
        features(*),
        signals(*)
      `)
      .gte('kickoff_time', new Date().toISOString())
      .lte('kickoff_time', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('kickoff_time');

    if (gamesError) {
      throw gamesError;
    }

    console.log(`Generating narratives for ${games?.length || 0} games`);
    console.log(`Economy mode: ${economyMode}, tokens used: ${tokenBudgetUsed}/${MAX_DAILY_TOKENS}`);

    let narrativesGenerated = 0;
    let narrativesCached = 0;

    for (const game of games || []) {
      // Create source hash for caching
      const sourceData = {
        predictions: game.predictions,
        features: game.features,
        injuries: game.signals?.filter((s: any) => s.signal_type === 'injury'),
        weather: game.signals?.filter((s: any) => s.signal_type === 'weather'),
      };
      const sourceHash = await createHash(JSON.stringify(sourceData));

      // Check if we have a cached narrative with this hash
      const { data: cachedNarrative } = await supabase
        .from('narratives')
        .select('*')
        .eq('game_id', game.id)
        .eq('source_hash', sourceHash)
        .eq('narrative_type', 'game')
        .order('generated_at', { ascending: false })
        .limit(1);

      if (cachedNarrative && cachedNarrative.length > 0) {
        console.log(`Using cached narrative for game ${game.id}`);
        narrativesCached++;
        continue;
      }

      // Skip narrative generation in economy mode unless close to kickoff
      const hoursToKickoff = (new Date(game.kickoff_time).getTime() - Date.now()) / (1000 * 60 * 60);
      if (economyMode && hoursToKickoff > 24) {
        console.log(`Skipping narrative for ${game.id} due to economy mode`);
        continue;
      }

      // Build context for AI
      const moneylinePred = game.predictions?.find((p: any) => p.market_type === 'moneyline');
      const spreadPred = game.predictions?.find((p: any) => p.market_type === 'spread');
      const totalPred = game.predictions?.find((p: any) => p.market_type === 'total');

      const injuries = game.signals?.filter((s: any) => s.signal_type === 'injury') || [];
      const weather = game.signals?.find((s: any) => s.signal_type === 'weather');

      const context = `
Game: ${game.away_team} @ ${game.home_team}
Kickoff: ${new Date(game.kickoff_time).toLocaleString()}

Model Predictions:
- Home Win Probability: ${(moneylinePred?.predicted_value * 100).toFixed(1)}%
- Predicted Spread: ${spreadPred?.predicted_value > 0 ? '+' : ''}${spreadPred?.predicted_value.toFixed(1)}
- Predicted Total: ${totalPred?.predicted_value.toFixed(1)}
- Confidence: ${(moneylinePred?.confidence * 100).toFixed(0)}%

Key Factors:
${injuries.length > 0 ? `- Injuries: ${injuries.length} reported` : '- No significant injuries'}
${weather ? `- Weather: ${JSON.stringify(weather.content)}` : '- Weather: Indoor/Normal'}

Market Consensus:
- Consensus Spread: ${game.features?.[0]?.feature_set?.consensus_spread || 'N/A'}
- Consensus Total: ${game.features?.[0]?.feature_set?.consensus_total || 'N/A'}
`;

      // Generate narrative using OpenAI
      const systemPrompt = `You are an expert NFL analyst. Generate a concise, insightful narrative (150-220 words) explaining the key factors driving this game's predictions. Focus on:
1. Why the model sees value or uncertainty
2. Impact of injuries and weather
3. Any divergence from market consensus
4. Risk factors that could affect outcomes

Be professional, data-driven, and avoid hype. Mention specific numbers and percentages.`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: hoursToKickoff < 6 ? 'gpt-5-2025-08-07' : 'gpt-5-mini-2025-08-07',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: context }
            ],
            max_completion_tokens: 300,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API error:', response.status, errorText);
          
          // Handle rate limiting
          if (response.status === 429) {
            console.log('Rate limited, entering economy mode');
            tokenBudgetUsed = MAX_DAILY_TOKENS; // Force economy mode
            continue;
          }
          
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const narrative = data.choices[0].message.content;
        const tokensUsed = data.usage?.total_tokens || 0;
        tokenBudgetUsed += tokensUsed;

        // Store narrative
        const { error: narrativeError } = await supabase
          .from('narratives')
          .insert({
            game_id: game.id,
            narrative_type: 'game',
            content: narrative,
            source_hash: sourceHash,
            is_cached: false,
            is_economy_mode: economyMode,
            generated_at: new Date().toISOString(),
          });

        if (narrativeError) {
          console.error(`Error storing narrative for ${game.id}:`, narrativeError);
        } else {
          narrativesGenerated++;
          console.log(`Generated narrative for ${game.id}, tokens used: ${tokensUsed}`);
        }

        // Respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate narrative for ${game.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        narratives_generated: narrativesGenerated,
        narratives_cached: narrativesCached,
        tokens_used: tokenBudgetUsed,
        economy_mode: economyMode,
        message: 'Narrative generation completed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Narrative generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});