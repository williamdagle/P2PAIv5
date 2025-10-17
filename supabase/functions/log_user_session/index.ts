import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS'
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
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, session_id, user_id, clinic_id, ip_address, user_agent, logout_reason, metadata } = body;

    if (action === 'start') {
      // Create new session
      const { data: session, error: insertError } = await supabaseClient
        .from('user_sessions')
        .insert({
          id: session_id,
          user_id,
          auth_user_id: user.id,
          clinic_id,
          ip_address,
          user_agent,
          metadata: metadata || {},
          session_start: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Session insert error:', insertError);
        console.error('Error details:', JSON.stringify(insertError, null, 2));
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to log session start',
            details: insertError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, session_id: session.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'end') {
      // End session
      const { error: updateError } = await supabaseClient
        .from('user_sessions')
        .update({
          session_end: new Date().toISOString(),
          logout_reason: logout_reason || 'user_initiated'
        })
        .eq('id', session_id)
        .eq('auth_user_id', user.id);

      if (updateError) {
        console.error('Session end error:', updateError);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'activity') {
      // Update last activity
      const { error: updateError } = await supabaseClient
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString()
        })
        .eq('id', session_id)
        .eq('auth_user_id', user.id);

      if (updateError) {
        console.error('Session activity update error:', updateError);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in log_user_session:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Session logging encountered an error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
