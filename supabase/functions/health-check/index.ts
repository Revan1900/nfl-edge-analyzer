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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const checks: any = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {},
    };

    // Check database connectivity
    const dbStart = Date.now();
    const { error: dbError } = await supabase.from('games').select('id').limit(1);
    checks.checks.database = {
      status: dbError ? 'unhealthy' : 'healthy',
      responseTime: Date.now() - dbStart,
      error: dbError?.message,
    };

    // Check data freshness
    const { data: latestOdds } = await supabase
      .from('odds_snapshots')
      .select('snapshot_time')
      .order('snapshot_time', { ascending: false })
      .limit(1);

    if (latestOdds && latestOdds.length > 0) {
      const hoursSinceUpdate = (Date.now() - new Date(latestOdds[0].snapshot_time).getTime()) / (1000 * 60 * 60);
      checks.checks.dataFreshness = {
        status: hoursSinceUpdate < 24 ? 'healthy' : 'stale',
        hoursSinceLastUpdate: hoursSinceUpdate.toFixed(1),
      };
    }

    // Check active data sources
    const { data: sources } = await supabase
      .from('source_registry')
      .select('is_active, consecutive_failures')
      .eq('is_active', true);

    const failingSources = sources?.filter((s) => s.consecutive_failures >= 3).length || 0;
    checks.checks.dataSources = {
      status: failingSources === 0 ? 'healthy' : 'degraded',
      totalActive: sources?.length || 0,
      failing: failingSources,
    };

    // Check recent predictions
    const { data: recentPredictions } = await supabase
      .from('predictions')
      .select('id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    checks.checks.predictions = {
      status: (recentPredictions?.length || 0) > 0 ? 'healthy' : 'inactive',
      count24h: recentPredictions?.length || 0,
    };

    // Overall status
    const unhealthyChecks = Object.values(checks.checks).filter(
      (check: any) => check.status === 'unhealthy'
    ).length;

    if (unhealthyChecks > 0) {
      checks.status = 'unhealthy';
    } else {
      const degradedChecks = Object.values(checks.checks).filter(
        (check: any) => check.status === 'degraded' || check.status === 'stale'
      ).length;
      
      if (degradedChecks > 0) {
        checks.status = 'degraded';
      }
    }

    const statusCode = checks.status === 'healthy' ? 200 : checks.status === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify(checks, null, 2), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
