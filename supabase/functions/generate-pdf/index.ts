import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameId } = await req.json();

    if (!gameId) {
      throw new Error('Game ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch game data
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;

    // Fetch predictions
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .eq('game_id', gameId);

    if (predError) throw predError;

    // Fetch narratives
    const { data: narratives, error: narrError } = await supabase
      .from('narratives')
      .select('*')
      .eq('game_id', gameId);

    if (narrError) throw narrError;

    // Generate HTML report
    const html = generateHTMLReport(game, predictions || [], narratives || []);

    // Convert HTML to PDF using a third-party service or library
    // For now, we'll return the HTML and let the client handle PDF generation
    // In production, you might use puppeteer or a PDF generation API

    return new Response(
      JSON.stringify({ 
        html,
        game,
        predictions,
        narratives
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateHTMLReport(game: any, predictions: any[], narratives: any[]): string {
  const prediction = predictions[0];
  const narrative = narratives.find((n) => n.narrative_type === 'game_analysis');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Game Report - ${game.away_team} @ ${game.home_team}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #1a1a1a;
          border-bottom: 3px solid #0066cc;
          padding-bottom: 10px;
        }
        .matchup {
          font-size: 1.5em;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .details {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .prediction {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .narrative {
          line-height: 1.6;
          margin: 20px 0;
        }
        .confidence {
          font-weight: bold;
          color: #0066cc;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ccc;
          font-size: 0.9em;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <h1>NFL Game Analysis Report</h1>
      
      <div class="matchup">
        ${game.away_team} @ ${game.home_team}
      </div>
      
      <div class="details">
        <p><strong>Date:</strong> ${new Date(game.kickoff_time).toLocaleString()}</p>
        <p><strong>Venue:</strong> ${game.venue || 'TBD'}</p>
        <p><strong>Week:</strong> ${game.week}, Season: ${game.season}</p>
      </div>
      
      ${prediction ? `
        <div class="prediction">
          <h2>Prediction</h2>
          <p><strong>Market:</strong> ${prediction.market_type}</p>
          <p><strong>Predicted Value:</strong> ${prediction.predicted_value}</p>
          <p class="confidence"><strong>Confidence:</strong> ${(prediction.confidence * 100).toFixed(1)}%</p>
          <p><strong>Model Version:</strong> ${prediction.model_version || 'v1.0'}</p>
        </div>
      ` : ''}
      
      ${narrative ? `
        <div class="narrative">
          <h2>Analysis</h2>
          <p>${narrative.content}</p>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>This report is for informational purposes only. Not gambling advice.</p>
      </div>
    </body>
    </html>
  `;
}
