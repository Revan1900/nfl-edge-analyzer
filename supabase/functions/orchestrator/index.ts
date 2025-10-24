import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting orchestrator pipeline...');
    const baseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(baseUrl, serviceKey);

    const results = {
      odds: { success: false, error: null, count: 0 },
      injuries: { success: false, error: null, count: 0 },
      weather: { success: false, error: null, count: 0 },
      features: { success: false, error: null, count: 0 },
      predictions: { success: false, error: null, count: 0 },
      calibration: { success: false, error: null, count: 0 },
      narratives: { success: false, error: null, count: 0 },
    };

    // Helper to log to audit
    const logStep = async (step: string, status: string, metadata: any) => {
      await supabase.from('audit_logs').insert({
        action: 'orchestrator_step',
        target_type: step,
        metadata: { status, ...metadata },
      });
    };

    // Step 1: Ingest odds
    console.log('Step 1: Ingesting odds...');
    try {
      const oddsResponse = await fetch(`${baseUrl}/functions/v1/ingest-odds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (oddsResponse.ok) {
        const oddsData = await oddsResponse.json();
        results.odds = { success: true, error: null, count: oddsData.games_processed || 0 };
        await logStep('ingest-odds', 'success', { count: oddsData.games_processed });
      } else {
        const errorText = await oddsResponse.text();
        results.odds = { success: false, error: errorText, count: 0 };
        await logStep('ingest-odds', 'error', { error: errorText });
      }
    } catch (error) {
      results.odds = { success: false, error: error.message, count: 0 };
      await logStep('ingest-odds', 'error', { error: error.message });
    }

    // Step 2: Ingest injuries
    console.log('Step 2: Ingesting injuries...');
    try {
      const injuriesResponse = await fetch(`${baseUrl}/functions/v1/ingest-injuries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (injuriesResponse.ok) {
        const injuriesData = await injuriesResponse.json();
        results.injuries = { success: true, error: null, count: injuriesData.injuries_processed || 0 };
        await logStep('ingest-injuries', 'success', { count: injuriesData.injuries_processed });
      } else {
        const errorText = await injuriesResponse.text();
        results.injuries = { success: false, error: errorText, count: 0 };
        await logStep('ingest-injuries', 'error', { error: errorText });
      }
    } catch (error) {
      results.injuries = { success: false, error: error.message, count: 0 };
      await logStep('ingest-injuries', 'error', { error: error.message });
    }

    // Step 3: Ingest weather
    console.log('Step 3: Ingesting weather...');
    try {
      const weatherResponse = await fetch(`${baseUrl}/functions/v1/ingest-weather`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        results.weather = { success: true, error: null, count: 1 };
        await logStep('ingest-weather', 'success', {});
      } else {
        const errorText = await weatherResponse.text();
        results.weather = { success: false, error: errorText, count: 0 };
        await logStep('ingest-weather', 'error', { error: errorText });
      }
    } catch (error) {
      results.weather = { success: false, error: error.message, count: 0 };
      await logStep('ingest-weather', 'error', { error: error.message });
    }

    // Step 4: Build features
    console.log('Step 4: Building features...');
    try {
      const featuresResponse = await fetch(`${baseUrl}/functions/v1/build-features`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (featuresResponse.ok) {
        results.features = { success: true, error: null, count: 1 };
        await logStep('build-features', 'success', {});
      } else {
        const errorText = await featuresResponse.text();
        results.features = { success: false, error: errorText, count: 0 };
        await logStep('build-features', 'error', { error: errorText });
      }
    } catch (error) {
      results.features = { success: false, error: error.message, count: 0 };
      await logStep('build-features', 'error', { error: error.message });
    }

    // Step 5: Generate predictions
    console.log('Step 5: Generating predictions...');
    try {
      const predictionsResponse = await fetch(`${baseUrl}/functions/v1/generate-predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (predictionsResponse.ok) {
        results.predictions = { success: true, error: null, count: 1 };
        await logStep('generate-predictions', 'success', {});
      } else {
        const errorText = await predictionsResponse.text();
        results.predictions = { success: false, error: errorText, count: 0 };
        await logStep('generate-predictions', 'error', { error: errorText });
      }
    } catch (error) {
      results.predictions = { success: false, error: error.message, count: 0 };
      await logStep('generate-predictions', 'error', { error: error.message });
    }

    // Step 6: Calibrate model (on completed games)
    console.log('Step 6: Calibrating model...');
    try {
      const calibrateResponse = await fetch(`${baseUrl}/functions/v1/calibrate-model`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (calibrateResponse.ok) {
        results.calibration = { success: true, error: null, count: 1 };
        await logStep('calibrate-model', 'success', {});
      } else {
        const errorText = await calibrateResponse.text();
        results.calibration = { success: false, error: errorText, count: 0 };
        await logStep('calibrate-model', 'error', { error: errorText });
      }
    } catch (error) {
      results.calibration = { success: false, error: error.message, count: 0 };
      await logStep('calibrate-model', 'error', { error: error.message });
    }

    // Step 7: Generate narratives
    console.log('Step 7: Generating narratives...');
    try {
      const narrativesResponse = await fetch(`${baseUrl}/functions/v1/generate-narratives`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (narrativesResponse.ok) {
        const narrativesData = await narrativesResponse.json();
        results.narratives = { 
          success: true, 
          error: null, 
          count: narrativesData.narratives_generated || 0 
        };
        await logStep('generate-narratives', 'success', { 
          generated: narrativesData.narratives_generated,
          cached: narrativesData.narratives_cached 
        });
      } else {
        const errorText = await narrativesResponse.text();
        results.narratives = { success: false, error: errorText, count: 0 };
        await logStep('generate-narratives', 'error', { error: errorText });
      }
    } catch (error) {
      results.narratives = { success: false, error: error.message, count: 0 };
      await logStep('generate-narratives', 'error', { error: error.message });
    }

    console.log('Orchestrator pipeline completed');

    const hasSuccess = Object.values(results).some(r => r.success);
    const hasFailures = Object.values(results).some(r => !r.success);

    return new Response(
      JSON.stringify({ 
        success: hasSuccess,
        partial: hasFailures,
        results,
        timestamp: new Date().toISOString(),
        message: hasSuccess ? 
          (hasFailures ? 'Pipeline completed with partial success' : 'Full pipeline executed successfully') :
          'Pipeline failed'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Orchestrator error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});