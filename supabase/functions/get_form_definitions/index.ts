import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
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

    const url = new URL(req.url);
    const form_id = url.searchParams.get('form_id');
    const category = url.searchParams.get('category');
    const include_versions = url.searchParams.get('include_versions') === 'true';

    let query = supabaseClient
      .from('form_definitions')
      .select(`
        *,
        creator:users!created_by(full_name),
        current_version:form_versions!current_version_id(*)
      `)
      .eq('clinic_id', userProfile.clinic_id)
      .order('created_at', { ascending: false });

    if (form_id) {
      query = query.eq('id', form_id);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: forms, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If versions requested, fetch all versions for each form
    if (include_versions && forms) {
      for (const form of forms) {
        const { data: versions } = await supabaseClient
          .from('form_versions')
          .select('*')
          .eq('form_definition_id', form.id)
          .order('version_number', { ascending: false });

        (form as any).versions = versions || [];
      }
    }

    return new Response(
      JSON.stringify(forms || []),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
