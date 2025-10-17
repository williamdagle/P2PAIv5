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
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('id, clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    // Get latest version number
    const { data: latestVersion } = await supabaseClient
      .from('form_versions')
      .select('version_number')
      .eq('form_definition_id', body.form_definition_id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    // Mark all other versions as not current
    await supabaseClient
      .from('form_versions')
      .update({ is_current: false })
      .eq('form_definition_id', body.form_definition_id);

    const versionData = {
      form_definition_id: body.form_definition_id,
      version_number: nextVersionNumber,
      version_name: body.version_name || `v${nextVersionNumber}.0`,
      form_schema: body.form_schema,
      state_codes: body.state_codes || [],
      effective_date: body.effective_date || new Date().toISOString().split('T')[0],
      expiration_date: body.expiration_date || null,
      change_summary: body.change_summary || null,
      is_current: true,
      created_by: userProfile.id
    };

    const { data: version, error } = await supabaseClient
      .from('form_versions')
      .insert(versionData)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update form definition with new current_version_id
    await supabaseClient
      .from('form_definitions')
      .update({ current_version_id: version.id })
      .eq('id', body.form_definition_id);

    return new Response(
      JSON.stringify(version),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
