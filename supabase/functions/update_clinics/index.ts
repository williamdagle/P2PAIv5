import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
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
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role_id, roles(name)')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !['System Admin', 'Clinic Admin'].includes(userProfile.roles?.name)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: System Admin or Clinic Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();
    const { id, name, clinic_type, clinic_code, aesthetics_module_enabled, clinic_settings, feature_flags } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (clinic_type !== undefined) updateData.clinic_type = clinic_type;
    if (clinic_code !== undefined) updateData.clinic_code = clinic_code;
    if (aesthetics_module_enabled !== undefined) updateData.aesthetics_module_enabled = aesthetics_module_enabled;
    if (clinic_settings !== undefined) updateData.clinic_settings = clinic_settings;
    if (feature_flags !== undefined) updateData.feature_flags = feature_flags;
    updateData.updated_at = new Date().toISOString();

    const { data: clinic, error: updateError } = await supabaseClient
      .from('clinics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ clinic }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in update_clinics:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});