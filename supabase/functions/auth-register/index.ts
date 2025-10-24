import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAuthInput, sanitizeEmail, checkRateLimit, getClientIp } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();
    
    // Rate limiting
    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp, 3, 60000)) {
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Input validation
    const validation = validateAuthInput(email, password);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase_url = Deno.env.get('SUPABASE_URL') ?? '';
    
    const supabase = createClient(
      supabase_url,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const redirectUrl = `${req.headers.get('origin')}/verify-email`;
    const sanitizedEmail = sanitizeEmail(email);
    
    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('Registration failed');
      return new Response(
        JSON.stringify({ error: 'Registration failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send welcome email after successful registration
    if (data.user) {
      try {
        const sendEmailResponse = await fetch(`${supabase_url}/functions/v1/send-transactional`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            type: 'welcome',
            user_id: data.user.id,
            email: email
          })
        });

        if (!sendEmailResponse.ok) {
          console.error('Failed to send welcome email');
        }
      } catch (emailError) {
        console.error('Error sending welcome email');
        // Don't fail registration if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Registration successful. Please check your email to verify your account.',
        user: data.user 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Request processing failed');
    return new Response(
      JSON.stringify({ error: 'Request processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});