import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Fetch injury data from NFL.com (simplified - would need actual scraping)
    // For demo purposes, we'll use a mock injury report
    const mockInjuryData = [
      {
        team: 'Kansas City Chiefs',
        player: 'Patrick Mahomes',
        position: 'QB',
        status: 'Questionable',
        injury: 'Ankle',
      },
    ];

    console.log('Processing injury data...');

    // Use OpenAI to normalize and extract structured data
    for (const injury of mockInjuryData) {
      const prompt = `Normalize this injury report and assign a severity score (0-1):
Player: ${injury.player}
Position: ${injury.position}
Status: ${injury.status}
Injury: ${injury.injury}

Return JSON with: player, position, status, injury_type, severity (0-1), confidence (0-1)`;

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-nano-2025-08-07',
          messages: [
            { role: 'system', content: 'You are a sports injury analyst. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          max_completion_tokens: 150,
        }),
      });

      if (!openaiResponse.ok) {
        console.error('OpenAI API error:', await openaiResponse.text());
        continue;
      }

      const openaiData = await openaiResponse.json();
      const normalizedData = JSON.parse(openaiData.choices[0].message.content);

      // Find games for this team
      const { data: games } = await supabase
        .from('games')
        .select('id')
        .or(`home_team.eq.${injury.team},away_team.eq.${injury.team}`)
        .gte('kickoff_time', new Date().toISOString())
        .limit(1);

      if (games && games.length > 0) {
        // Store injury signal
        const { error } = await supabase
          .from('signals')
          .insert({
            game_id: games[0].id,
            signal_type: 'injury',
            source: 'NFL.com',
            content: normalizedData,
            confidence: normalizedData.confidence,
            timestamp: new Date().toISOString(),
          });

        if (error) {
          console.error('Error storing injury signal:', error);
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
      .eq('source_type', 'injury');

    return new Response(
      JSON.stringify({ 
        success: true,
        injuries_processed: mockInjuryData.length,
        message: 'Injury ingestion completed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Injury ingestion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});