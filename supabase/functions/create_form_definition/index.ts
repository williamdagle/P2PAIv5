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
      .select('id, clinic_id, organization_id:clinics!inner(organization_id)')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    // Create form definition
    const formData = {
      clinic_id: userProfile.clinic_id,
      organization_id: (userProfile as any).organization_id?.organization_id || null,
      form_name: body.form_name,
      form_code: body.form_code,
      category: body.category || 'other',
      description: body.description,
      is_active: body.is_active !== undefined ? body.is_active : true,
      is_published: false,
      created_by: userProfile.id
    };

    const { data: form, error: formError } = await supabaseClient
      .from('form_definitions')
      .insert(formData)
      .select()
      .single();

    if (formError) {
      return new Response(
        JSON.stringify({ error: formError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create initial version if form schema provided
    if (body.form_schema) {
      const versionData = {
        form_definition_id: form.id,
        version_number: 1,
        version_name: body.version_name || 'v1.0 - Initial Version',
        form_schema: body.form_schema,
        state_codes: body.state_codes || [],
        effective_date: body.effective_date || new Date().toISOString().split('T')[0],
        is_current: true,
        created_by: userProfile.id
      };

      const { data: version, error: versionError } = await supabaseClient
        .from('form_versions')
        .insert(versionData)
        .select()
        .single();

      if (versionError) {
        // Rollback form creation
        await supabaseClient.from('form_definitions').delete().eq('id', form.id);
        return new Response(
          JSON.stringify({ error: versionError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update form with current_version_id
      await supabaseClient
        .from('form_definitions')
        .update({ current_version_id: version.id })
        .eq('id', form.id);

      (form as any).current_version = version;
    }

    return new Response(
      JSON.stringify(form),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
