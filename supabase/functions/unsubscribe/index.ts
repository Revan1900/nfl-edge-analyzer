import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        },
        auth: { persistSession: false }
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Unsubscribe request from user ${user.id} for type: ${type}`);

    // Get current preferences
    const { data: settings, error: fetchError } = await supabase
      .from('user_settings')
      .select('notification_prefs')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching settings:', fetchError);
      throw fetchError;
    }

    const currentPrefs = (settings?.notification_prefs as any) || {};
    
    // Update preferences based on type
    let updatedPrefs = { ...currentPrefs };
    
    if (type === 'weekly' || type === 'all') {
      updatedPrefs.weekly_email = false;
    }
    
    if (type === 'alerts' || type === 'all') {
      updatedPrefs.game_alerts = false;
    }

    // Update in database
    const { error: updateError } = await supabase
      .from('user_settings')
      .update({ notification_prefs: updatedPrefs })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating settings:', updateError);
      throw updateError;
    }

    // Log unsubscribe action
    await supabase.from('audit_logs').insert({
      action: 'unsubscribe',
      actor: user.id,
      metadata: { 
        type: type,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`User ${user.id} unsubscribed from ${type} emails`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully unsubscribed',
        preferences: updatedPrefs
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in unsubscribe:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
