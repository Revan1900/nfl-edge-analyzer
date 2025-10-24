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

    const results: any[] = [];

    // Step 1: Ingest odds
    console.log('Step 1: Ingesting odds...');
    const oddsResponse = await fetch(`${baseUrl}/functions/v1/ingest-odds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });
    results.push({ step: 'ingest-odds', status: oddsResponse.status });

    // Step 2: Ingest injuries
    console.log('Step 2: Ingesting injuries...');
    const injuriesResponse = await fetch(`${baseUrl}/functions/v1/ingest-injuries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });
    results.push({ step: 'ingest-injuries', status: injuriesResponse.status });

    // Step 3: Ingest weather
    console.log('Step 3: Ingesting weather...');
    const weatherResponse = await fetch(`${baseUrl}/functions/v1/ingest-weather`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });
    results.push({ step: 'ingest-weather', status: weatherResponse.status });

    // Step 4: Build features
    console.log('Step 4: Building features...');
    const featuresResponse = await fetch(`${baseUrl}/functions/v1/build-features`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });
    results.push({ step: 'build-features', status: featuresResponse.status });

    // Step 5: Generate predictions
    console.log('Step 5: Generating predictions...');
    const predictionsResponse = await fetch(`${baseUrl}/functions/v1/generate-predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });
    results.push({ step: 'generate-predictions', status: predictionsResponse.status });

    // Step 6: Calibrate model (on completed games)
    console.log('Step 6: Calibrating model...');
    const calibrateResponse = await fetch(`${baseUrl}/functions/v1/calibrate-model`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });
    results.push({ step: 'calibrate-model', status: calibrateResponse.status });

    // Step 7: Generate narratives
    console.log('Step 7: Generating narratives...');
    const narrativesResponse = await fetch(`${baseUrl}/functions/v1/generate-narratives`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });
    results.push({ step: 'generate-narratives', status: narrativesResponse.status });

    console.log('Orchestrator pipeline completed');

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        message: 'Full pipeline executed successfully'
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