import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const body = await req.json();
    const {
      email,
      auth_user_id,
      event_type,
      ip_address,
      user_agent,
      failure_reason,
      session_id,
      metadata
    } = body;

    // Validate required fields
    if (!email || !event_type) {
      return new Response(
        JSON.stringify({ error: 'email and event_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert authentication event
    const { data, error: insertError } = await supabaseClient
      .from('authentication_events')
      .insert({
        email,
        auth_user_id,
        event_type,
        ip_address,
        user_agent,
        failure_reason,
        session_id,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      });

    if (insertError) {
      console.error('Authentication event insert error:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to log authentication event',
          details: insertError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in log_authentication_event:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Logging encountered an error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
