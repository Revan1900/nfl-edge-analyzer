import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "admin@dynamicaihub.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const accessToken = authHeader.replace("Bearer ", "");

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "No authorization token provided" }), {
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    // Validate caller
    const { data: userRes, error: userErr } = await supabase.auth.getUser(accessToken);
    
    if (userErr || !userRes?.user?.email) {
      console.error("Auth error:", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const email = (userRes.user.email || "").toLowerCase();
    console.log(`Request from user: ${email}`);
    
    if (email !== ADMIN_EMAIL) {
      console.warn(`Forbidden: ${email} is not admin`);
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Admin verified, triggering ingest-odds...");

    // Invoke ingest-odds with service role
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ingest-odds`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json"
      },
    });
    
    const text = await res.text();
    console.log(`ingest-odds response (${res.status}):`, text);

    return new Response(JSON.stringify({ 
      ok: res.ok, 
      status: res.status,
      ingest_odds: text 
    }), {
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error in trigger-refresh:", e);
    return new Response(JSON.stringify({ 
      error: "Internal error",
      details: e instanceof Error ? e.message : String(e)
    }), {
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
