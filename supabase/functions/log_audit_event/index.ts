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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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
    const {
      user_id,
      clinic_id,
      event_type,
      event_action,
      resource_type,
      resource_id,
      ip_address,
      user_agent,
      request_metadata,
      phi_accessed,
      severity,
      session_id
    } = body;

    // Validate required fields
    if (!event_type || !event_action) {
      return new Response(
        JSON.stringify({ error: 'event_type and event_action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize resource_id - must be a valid UUID or null
    let validatedResourceId = resource_id;
    if (resource_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(resource_id)) {
        console.warn(`Invalid UUID format for resource_id: "${resource_id}". Setting to null.`);
        validatedResourceId = null;
      }
    }

    // Insert audit log
    const { data, error: insertError } = await supabaseClient
      .from('audit_logs')
      .insert({
        user_id,
        auth_user_id: user.id,
        clinic_id,
        event_type,
        event_action,
        resource_type,
        resource_id: validatedResourceId,
        ip_address,
        user_agent,
        request_metadata: request_metadata || {},
        phi_accessed: phi_accessed || false,
        severity: severity || 'low',
        session_id,
        timestamp: new Date().toISOString()
      });

    if (insertError) {
      console.error('Audit log insert error:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to log audit event',
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
    console.error('Error in log_audit_event:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Audit logging encountered an error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
