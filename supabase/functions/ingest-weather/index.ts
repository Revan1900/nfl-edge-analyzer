import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// NFL Stadium coordinates
const STADIUM_COORDS: Record<string, { lat: number; lon: number }> = {
  'Arrowhead Stadium': { lat: 39.0489, lon: -94.4839 },
  'Lambeau Field': { lat: 44.5013, lon: -88.0622 },
  'MetLife Stadium': { lat: 40.8128, lon: -74.0742 },
  'AT&T Stadium': { lat: 32.7473, lon: -97.0945 },
  'Mercedes-Benz Stadium': { lat: 33.7553, lon: -84.4006 },
  'Soldier Field': { lat: 41.8623, lon: -87.6167 },
  'Paul Brown Stadium': { lat: 39.0954, lon: -84.5160 },
  'FirstEnergy Stadium': { lat: 41.5061, lon: -81.6995 },
  'Empower Field at Mile High': { lat: 39.7439, lon: -104.9942 },
  'Ford Field': { lat: 42.3400, lon: -83.0456 },
  'NRG Stadium': { lat: 29.6847, lon: -95.4107 },
  'Lucas Oil Stadium': { lat: 39.7601, lon: -86.1639 },
  'TIAA Bank Field': { lat: 30.3239, lon: -81.6373 },
  'SoFi Stadium': { lat: 33.9535, lon: -118.3387 },
  'Allegiant Stadium': { lat: 36.0909, lon: -115.1833 },
  'Hard Rock Stadium': { lat: 25.9580, lon: -80.2389 },
  'U.S. Bank Stadium': { lat: 44.9738, lon: -93.2575 },
  'Gillette Stadium': { lat: 42.0909, lon: -71.2643 },
  'Caesars Superdome': { lat: 29.9511, lon: -90.0812 },
  'Lincoln Financial Field': { lat: 39.9008, lon: -75.1675 },
  'State Farm Stadium': { lat: 33.5276, lon: -112.2626 },
  'Acrisure Stadium': { lat: 40.4468, lon: -80.0158 },
  "Levi's Stadium": { lat: 37.4032, lon: -121.9698 },
  'Lumen Field': { lat: 47.5952, lon: -122.3316 },
  'Raymond James Stadium': { lat: 27.9759, lon: -82.5033 },
  'Nissan Stadium': { lat: 36.1665, lon: -86.7713 },
  'FedExField': { lat: 38.9076, lon: -76.8645 },
  'M&T Bank Stadium': { lat: 39.2780, lon: -76.6227 },
  'Bank of America Stadium': { lat: 35.2258, lon: -80.8530 },
  'Highmark Stadium': { lat: 42.7738, lon: -78.7870 },
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