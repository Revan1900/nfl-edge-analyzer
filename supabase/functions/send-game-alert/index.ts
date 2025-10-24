import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { generateGameAlertEmail } from "../_shared/email-templates.ts";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { game_id, edge, prediction_id } = await req.json();

    if (!game_id || !edge) {
      return new Response(
        JSON.stringify({ error: 'game_id and edge are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log(`Processing game alert for game ${game_id} with edge ${edge}%`);

    // Get game details
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('away_team, home_team, game_date')
      .eq('id', game_id)
      .single();

    if (gameError || !game) {
      console.error('Error fetching game:', gameError);
      throw new Error('Game not found');
    }

    // Get prediction details
    const { data: prediction, error: predError } = await supabase
      .from('predictions')
      .select('model_probability, implied_probability, market_type')
      .eq('game_id', game_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (predError) {
      console.error('Error fetching prediction:', predError);
    }

    // Get users who opted in for game alerts
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, notification_prefs')
      .not('notification_prefs', 'is', null);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw settingsError;
    }

    const optedInUsers = settings?.filter(s => 
      s.notification_prefs && 
      typeof s.notification_prefs === 'object' && 
      'game_alerts' in s.notification_prefs && 
      s.notification_prefs.game_alerts === true
    ) || [];

    console.log(`Found ${optedInUsers.length} users with game alerts enabled`);

    let alerted = 0;
    let skipped = 0;

    for (const userSetting of optedInUsers) {
      try {
        // Check if user already received alert for this game (throttling)
        const { data: existingAlert } = await supabase
          .from('audit_logs')
          .select('id')
          .eq('action', 'email_sent')
          .eq('actor', userSetting.user_id)
          .contains('metadata', { type: 'game_alert', game_id: game_id })
          .limit(1);

        if (existingAlert && existingAlert.length > 0) {
          console.log(`User ${userSetting.user_id} already alerted for game ${game_id}`);
          skipped++;
          continue;
        }

        // Get user email
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userSetting.user_id);
        
        if (authError || !authData.user?.email) {
          console.error(`Failed to get email for user ${userSetting.user_id}:`, authError);
          skipped++;
          continue;
        }

        // Generate and send alert email
        const emailContent = generateGameAlertEmail({
          userName: authData.user.email.split('@')[0],
          awayTeam: game.away_team,
          homeTeam: game.home_team,
          market: prediction?.market_type || 'Spread',
          modelProbability: prediction?.model_probability || 0,
          impliedProbability: prediction?.implied_probability || 0,
          edge: edge,
          gameId: game_id
        });

        await resend.emails.send({
          from: 'NFL Analytics Pro <alerts@dynamicaihub.com>',
          to: authData.user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        alerted++;
        
        // Log success
        await supabase.from('audit_logs').insert({
          action: 'email_sent',
          actor: userSetting.user_id,
          metadata: { 
            type: 'game_alert',
            game_id: game_id,
            edge: edge,
            status: 'success'
          }
        });

        console.log(`Sent game alert to ${authData.user.email}`);

      } catch (error: any) {
        console.error(`Failed to send alert to user ${userSetting.user_id}:`, error);
        
        await supabase.from('audit_logs').insert({
          action: 'email_failed',
          actor: userSetting.user_id,
          metadata: { 
            type: 'game_alert',
            game_id: game_id,
            error: error.message 
          }
        });
      }

      // Rate limit: 100ms delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Game alert complete: ${alerted} alerted, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true,
        alerted,
        skipped,
        game_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in send-game-alert:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
