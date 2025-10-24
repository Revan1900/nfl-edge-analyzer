import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const alerts: Alert[] = [];

    // Check 1: Model performance degradation
    const { data: recentEvals } = await supabase
      .from('evaluations')
      .select('brier_score, log_loss, error')
      .order('evaluated_at', { ascending: false })
      .limit(10);

    if (recentEvals && recentEvals.length >= 5) {
      const avgBrier = recentEvals.reduce((sum, e) => sum + (e.brier_score || 0), 0) / recentEvals.length;
      
      if (avgBrier > 0.25) {
        alerts.push({
          type: 'model_performance',
          severity: 'warning',
          message: 'Model Brier score degradation detected',
          details: { avgBrierScore: avgBrier, threshold: 0.25 },
        });
      }

      const avgError = recentEvals.reduce((sum, e) => sum + Math.abs(e.error || 0), 0) / recentEvals.length;
      
      if (avgError > 10) {
        alerts.push({
          type: 'model_accuracy',
          severity: 'critical',
          message: 'Model accuracy significantly decreased',
          details: { avgError, threshold: 10 },
        });
      }
    }

    // Check 2: Data source failures
    const { data: sources } = await supabase
      .from('source_registry')
      .select('*')
      .eq('is_active', true);

    const failingSources = sources?.filter((s) => s.consecutive_failures >= 3) || [];
    
    if (failingSources.length > 0) {
      alerts.push({
        type: 'data_source',
        severity: failingSources.length > 2 ? 'critical' : 'warning',
        message: `${failingSources.length} data source(s) failing`,
        details: { sources: failingSources.map((s) => s.source_name) },
      });
    }

    // Check 3: Stale data
    const { data: latestOdds } = await supabase
      .from('odds_snapshots')
      .select('snapshot_time')
      .order('snapshot_time', { ascending: false })
      .limit(1);

    if (latestOdds && latestOdds.length > 0) {
      const hoursSinceUpdate = (Date.now() - new Date(latestOdds[0].snapshot_time).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > 24) {
        alerts.push({
          type: 'stale_data',
          severity: 'warning',
          message: 'Odds data is stale',
          details: { hoursSinceUpdate: hoursSinceUpdate.toFixed(1) },
        });
      }
    }

    // Check 4: Prediction coverage
    const { data: upcomingGames } = await supabase
      .from('games')
      .select('id')
      .gte('kickoff_time', new Date().toISOString())
      .lte('kickoff_time', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    const { data: predictions } = await supabase
      .from('predictions')
      .select('game_id')
      .in('game_id', upcomingGames?.map(g => g.id) || []);

    const predictionCoverage = predictions && upcomingGames 
      ? (predictions.length / upcomingGames.length) * 100 
      : 0;

    if (predictionCoverage < 80) {
      alerts.push({
        type: 'prediction_coverage',
        severity: 'warning',
        message: 'Low prediction coverage for upcoming games',
        details: { coverage: predictionCoverage.toFixed(1) + '%' },
      });
    }

    // Log alerts to audit_logs
    for (const alert of alerts) {
      await supabase.from('audit_logs').insert({
        action: 'alert_generated',
        target: alert.type,
        meta: {
          severity: alert.severity,
          message: alert.message,
          details: alert.details,
        },
      });
    }

    console.log(`Alert monitor completed. Generated ${alerts.length} alerts.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertCount: alerts.length,
        alerts,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in alert monitor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
