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
    const patient_id = url.searchParams.get('patient_id');
    const form_definition_id = url.searchParams.get('form_definition_id');
    const submission_id = url.searchParams.get('submission_id');
    const is_complete = url.searchParams.get('is_complete');
    const from_date = url.searchParams.get('from_date');
    const to_date = url.searchParams.get('to_date');

    let query = supabaseClient
      .from('patient_form_submissions')
      .select(`
        *,
        patient:patients(id, first_name, last_name, email),
        form:form_definitions(id, form_name, category),
        version:form_versions(id, version_number, version_name),
        submitter:users!submitted_by_user_id(full_name),
        assignment:patient_form_assignments(id, status, due_date)
      `)
      .eq('clinic_id', userProfile.clinic_id)
      .order('created_at', { ascending: false });

    if (submission_id) {
      query = query.eq('id', submission_id);
    }

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    if (form_definition_id) {
      query = query.eq('form_definition_id', form_definition_id);
    }

    if (is_complete !== null && is_complete !== undefined) {
      query = query.eq('is_complete', is_complete === 'true');
    }

    if (from_date) {
      query = query.gte('submitted_at', from_date);
    }

    if (to_date) {
      query = query.lte('submitted_at', to_date);
    }

    const { data, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data || []),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
