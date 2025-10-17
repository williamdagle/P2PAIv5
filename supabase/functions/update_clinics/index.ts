import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[update_clinics:${requestId}] Request received:`, req.method, req.url);

  if (req.method === 'OPTIONS') {
    console.log(`[update_clinics:${requestId}] Handling OPTIONS preflight`);
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();

  try {
    console.log(`[update_clinics:${requestId}] Creating Supabase client`);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log(`[update_clinics:${requestId}] Authenticating user`);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error(`[update_clinics:${requestId}] Authentication failed:`, userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log(`[update_clinics:${requestId}] User authenticated:`, user.id);

    console.log(`[update_clinics:${requestId}] Checking user role`);
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role_id, roles(name)')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !['System Admin', 'Clinic Admin'].includes(userProfile.roles?.name)) {
      console.error(`[update_clinics:${requestId}] Authorization failed. Role:`, userProfile?.roles?.name, 'Error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: System Admin or Clinic Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log(`[update_clinics:${requestId}] User authorized with role:`, userProfile.roles?.name);

    console.log(`[update_clinics:${requestId}] Parsing request body`);
    const body = await req.json();
    console.log(`[update_clinics:${requestId}] Body received:`, JSON.stringify(body).substring(0, 500));
    const { id, name, clinic_type, clinic_code, aesthetics_module_enabled, clinic_settings, feature_flags } = body;

    if (!id) {
      console.error(`[update_clinics:${requestId}] Missing clinic ID`);
      return new Response(
        JSON.stringify({ error: 'Missing required field: id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log(`[update_clinics:${requestId}] Updating clinic:`, id);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (clinic_type !== undefined) updateData.clinic_type = clinic_type;
    if (clinic_code !== undefined) updateData.clinic_code = clinic_code;
    if (aesthetics_module_enabled !== undefined) updateData.aesthetics_module_enabled = aesthetics_module_enabled;
    if (clinic_settings !== undefined) updateData.clinic_settings = clinic_settings;
    if (feature_flags !== undefined) updateData.feature_flags = feature_flags;
    updateData.updated_at = new Date().toISOString();

    console.log(`[update_clinics:${requestId}] Executing database update with data:`, updateData);
    const { data: clinic, error: updateError } = await supabaseClient
      .from('clinics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error(`[update_clinics:${requestId}] Database update failed:`, updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const elapsed = Date.now() - startTime;
    console.log(`[update_clinics:${requestId}] Update successful in ${elapsed}ms. Returning clinic data.`);

    return new Response(
      JSON.stringify({ clinic }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[update_clinics:${requestId}] Unexpected error after ${elapsed}ms:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});