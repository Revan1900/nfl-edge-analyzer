import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { generateWelcomeEmail } from "../_shared/email-templates.ts";

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
    const { type, user_id, email } = await req.json();

    if (!type || !email) {
      return new Response(
        JSON.stringify({ error: 'type and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log(`Sending ${type} email to ${email}`);

    let emailContent;
    const userName = email.split('@')[0];

    switch (type) {
      case 'welcome':
        emailContent = generateWelcomeEmail({ userName });
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown email type: ${type}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'NFL Analytics Pro <onboarding@resend.dev>',
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (emailError) {
      throw emailError;
    }

    console.log('Email sent successfully:', emailData);

    // Log to audit if user_id provided
    if (user_id) {
      await supabase.from('audit_logs').insert({
        action: 'email_sent',
        actor: user_id,
        metadata: { 
          type: type,
          status: 'success',
          email_id: emailData?.id
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${type} email sent successfully`,
        email_id: emailData?.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in send-transactional:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
