import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Stadium coordinates (simplified subset)
const STADIUM_COORDS: Record<string, { lat: number; lon: number }> = {
  'Arrowhead Stadium': { lat: 39.0489, lon: -94.4839 },
  'Lambeau Field': { lat: 44.5013, lon: -88.0622 },
  'MetLife Stadium': { lat: 40.8128, lon: -74.0742 },
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
      .select('id, venue, kickoff_time')
      .gte('kickoff_time', new Date().toISOString())
      .lte('kickoff_time', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    if (gamesError) {
      throw gamesError;
    }

    console.log(`Processing weather for ${games?.length || 0} games`);

    for (const game of games || []) {
      const coords = game.venue ? STADIUM_COORDS[game.venue] : null;
      
      if (!coords) {
        console.log(`No coordinates for venue: ${game.venue}`);
        continue;
      }

      // Fetch weather from Open-Meteo (free, no API key required)
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,precipitation,windspeed_10m&timezone=America/New_York`
      );

      if (!weatherResponse.ok) {
        console.error('Weather API error:', weatherResponse.status);
        continue;
      }

      const weatherData = await weatherResponse.json();
      
      // Find weather at kickoff time
      const kickoffHour = new Date(game.kickoff_time).getHours();
      const weatherAtKickoff = {
        temperature: weatherData.hourly.temperature_2m[kickoffHour],
        precipitation: weatherData.hourly.precipitation[kickoffHour],
        windspeed: weatherData.hourly.windspeed_10m[kickoffHour],
      };

      // Calculate severity score
      let severity = 0;
      if (weatherAtKickoff.temperature < 20) severity += 0.3;
      if (weatherAtKickoff.windspeed > 20) severity += 0.3;
      if (weatherAtKickoff.precipitation > 0.5) severity += 0.4;
      severity = Math.min(severity, 1.0);

      // Store weather signal
      const { error } = await supabase
        .from('signals')
        .insert({
          game_id: game.id,
          signal_type: 'weather',
          source: 'Open-Meteo',
          content: {
            ...weatherAtKickoff,
            severity,
            venue: game.venue,
          },
          confidence: 0.95,
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing weather signal:', error);
      }
    }

    // Update source registry
    await supabase
      .from('source_registry')
      .update({
        last_success: new Date().toISOString(),
        consecutive_failures: 0,
      })
      .eq('source_type', 'weather');

    return new Response(
      JSON.stringify({ 
        success: true,
        games_processed: games?.length || 0,
        message: 'Weather ingestion completed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Weather ingestion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});