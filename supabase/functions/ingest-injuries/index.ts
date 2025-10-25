import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting injury ingestion from ESPN...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch from ESPN injury report page
    const espnResponse = await fetch('https://www.espn.com/nfl/injuries');
    
    if (!espnResponse.ok) {
      throw new Error(`ESPN fetch failed: ${espnResponse.status}`);
    }

    const html = await espnResponse.text();
    const $ = cheerio.load(html);
    
    let injuriesProcessed = 0;
    const processedPlayers = new Set<string>();

    // Parse ESPN injury table structure
    $('.ResponsiveTable').each((_tableIdx, table) => {
      const teamName = $(table).find('.Table__Title').text().trim();
      
      if (!teamName) return;

      $(table).find('tbody tr').each((_rowIdx, row) => {
        try {
          const cells = $(row).find('td');
          if (cells.length < 4) return;

          const playerName = $(cells[0]).text().trim();
          const position = $(cells[1]).text().trim();
          const status = $(cells[2]).text().trim();
          const injury = $(cells[3]).text().trim();

          if (!playerName || processedPlayers.has(`${teamName}-${playerName}`)) return;
          
          processedPlayers.add(`${teamName}-${playerName}`);

          // Determine severity
          let severity = 'unknown';
          const statusLower = status.toLowerCase();
          if (statusLower.includes('out')) severity = 'high';
          else if (statusLower.includes('doubtful')) severity = 'high';
          else if (statusLower.includes('questionable')) severity = 'medium';
          else if (statusLower.includes('probable')) severity = 'low';

          // Get upcoming games for this team
          supabase
            .from('games')
            .select('id')
            .or(`home_team.eq.${teamName},away_team.eq.${teamName}`)
            .gte('kickoff_time', new Date().toISOString())
            .order('kickoff_time', { ascending: true })
            .limit(1)
            .then(({ data: games }) => {
              if (games && games.length > 0) {
                supabase.from('signals').insert({
                  game_id: games[0].id,
                  signal_type: 'injury',
                  source: 'espn',
                  content: {
                    team: teamName,
                    player: playerName,
                    position,
                    status,
                    injury,
                    severity
                  },
                  confidence: severity === 'high' ? 0.9 : severity === 'medium' ? 0.7 : 0.5,
                  timestamp: new Date().toISOString()
                }).then(() => {
                  console.log(`Stored injury: ${playerName} (${teamName})`);
                });
              }
            });

          injuriesProcessed++;
        } catch (err) {
          console.error('Error parsing injury row:', err);
        }
      });
    });

    console.log(`Processed ${injuriesProcessed} injuries from ESPN`);

    // Update source registry
    await supabase
      .from('source_registry')
      .update({
        last_success: new Date().toISOString(),
        consecutive_failures: 0,
      })
      .eq('source_type', 'injuries');

    return new Response(
      JSON.stringify({ 
        success: true,
        injuries_processed: injuriesProcessed,
        message: 'Injury data ingested from ESPN successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Injury ingestion error:', error);
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
        })
        .eq('source_type', 'injuries');
    } catch (updateError) {
      console.error('Failed to update source registry:', updateError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});