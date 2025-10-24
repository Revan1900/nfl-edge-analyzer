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

    // Fetch injury data from ESPN API
    console.log('Fetching injury data from ESPN...');
    const espnResponse = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries');
    
    if (!espnResponse.ok) {
      throw new Error(`ESPN API error: ${espnResponse.status}`);
    }

    const espnData = await espnResponse.json();
    const injuryData = [];

    // Parse ESPN injury data structure
    for (const teamData of espnData.injuries || []) {
      const teamName = teamData.team?.displayName || 'Unknown Team';
      
      for (const injury of teamData.injuries || []) {
        injuryData.push({
          team: teamName,
          player: injury.athlete?.displayName || 'Unknown',
          position: injury.athlete?.position?.abbreviation || 'N/A',
          status: injury.status || 'Unknown',
          injury: injury.details?.type || 'Unknown',
        });
      }
    }

    console.log(`Processing ${injuryData.length} injuries...`);

    // Use OpenAI to normalize and extract structured data with retry logic
    for (const injury of injuryData) {
      const prompt = `Normalize this injury report and assign a severity score (0-1):
Player: ${injury.player}
Position: ${injury.position}
Status: ${injury.status}
Injury: ${injury.injury}

Return JSON with: player, position, status, injury_type, severity (0-1), confidence (0-1)`;

      // Retry logic for OpenAI
      let openaiResponse;
      let lastError = '';
      
      for (let attempt = 0; attempt < 3; attempt++) {
        openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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

        if (openaiResponse.status === 429) {
          const retryAfter = parseInt(openaiResponse.headers.get('Retry-After') || '5');
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        if (openaiResponse.ok) break;
        
        lastError = await openaiResponse.text();
        if (attempt === 2) {
          console.error('OpenAI API error after retries:', lastError);
          continue;
        }
      }

      if (!openaiResponse || !openaiResponse.ok) {
        console.error('Failed to normalize injury:', lastError);
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
        injuries_processed: injuryData.length,
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