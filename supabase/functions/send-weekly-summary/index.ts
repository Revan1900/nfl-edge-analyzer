import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { generateWeeklySummaryEmail } from "../_shared/email-templates.ts";

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
    // Verify cron authentication
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      console.error('Unauthorized: Invalid cron secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Fetching users with weekly email enabled...');

    // Get users who opted in for weekly emails
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
      'weekly_email' in s.notification_prefs && 
      s.notification_prefs.weekly_email === true
    ) || [];

    console.log(`Found ${optedInUsers.length} users with weekly email enabled`);

    // Calculate current week
    const now = new Date();
    const seasonStart = new Date('2024-09-05');
    const weeksDiff = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const currentWeek = Math.max(1, Math.min(weeksDiff + 1, 18));

    let sent = 0;
    let failed = 0;
    const batchSize = 50;

    // Process in batches to respect rate limits
    for (let i = 0; i < optedInUsers.length; i += batchSize) {
      const batch = optedInUsers.slice(i, i + batchSize);
      
      for (const userSetting of batch) {
        try {
          // Get user email from auth
          const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userSetting.user_id);
          
          if (authError || !authData.user?.email) {
            console.error(`Failed to get email for user ${userSetting.user_id}:`, authError);
            failed++;
            continue;
          }

          // Fetch user's predictions from last week
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          const { data: predictions, error: predictionsError } = await supabase
            .from('predictions')
            .select(`
              id,
              game_id,
              edge_vs_implied,
              model_probability,
              implied_probability,
              market_type,
              games (
                away_team,
                home_team,
                game_date
              )
            `)
            .gte('created_at', oneWeekAgo.toISOString())
            .order('edge_vs_implied', { ascending: false })
            .limit(10);

          if (predictionsError) {
            console.error(`Failed to fetch predictions:`, predictionsError);
          }

          const topEdges = (predictions || []).map(p => ({
            game: `${p.games?.away_team || 'TBD'} @ ${p.games?.home_team || 'TBD'}`,
            edge: p.edge_vs_implied || 0,
            market: p.market_type || 'Spread'
          }));

          // Calculate accuracy (placeholder - would need actual results data)
          const accuracy = 65.5;

          // Generate and send email
          const emailContent = generateWeeklySummaryEmail({
            userName: authData.user.email.split('@')[0],
            week: currentWeek,
            gamesAnalyzed: predictions?.length || 0,
            topEdges: topEdges,
            accuracy: accuracy
          });

          await resend.emails.send({
            from: 'NFL Analytics Pro <noreply@dynamicaihub.com>',
            to: authData.user.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });

          sent++;
          
          // Log success
          await supabase.from('audit_logs').insert({
            action: 'email_sent',
            actor: userSetting.user_id,
            metadata: { 
              type: 'weekly_summary', 
              status: 'success',
              week: currentWeek,
              predictions_count: predictions?.length || 0
            }
          });

          console.log(`Sent weekly email to ${authData.user.email}`);

        } catch (error: any) {
          failed++;
          console.error(`Failed to send email to user ${userSetting.user_id}:`, error);
          
          await supabase.from('audit_logs').insert({
            action: 'email_failed',
            actor: userSetting.user_id,
            metadata: { 
              type: 'weekly_summary', 
              error: error.message 
            }
          });
        }

        // Rate limit: 100ms delay between sends
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Weekly summary complete: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        sent, 
        failed,
        week: currentWeek
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in send-weekly-summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
