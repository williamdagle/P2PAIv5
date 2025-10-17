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

    // Get the current version of the form
    const { data: formDef, error: formError } = await supabaseClient
      .from('form_definitions')
      .select('id, current_version_id')
      .eq('id', body.form_definition_id)
      .eq('is_active', true)
      .single();

    if (formError || !formDef) {
      return new Response(
        JSON.stringify({ error: 'Form not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate due date if not provided
    let dueDate = body.due_date;
    if (!dueDate && body.due_days_offset) {
      const date = new Date();
      date.setDate(date.getDate() + body.due_days_offset);
      dueDate = date.toISOString().split('T')[0];
    }

    const assignmentData = {
      clinic_id: userProfile.clinic_id,
      patient_id: body.patient_id,
      form_definition_id: body.form_definition_id,
      form_version_id: formDef.current_version_id,
      assigned_by: userProfile.id,
      due_date: dueDate,
      priority: body.priority || 'medium',
      status: 'assigned',
      assignment_reason: body.assignment_reason || null
    };

    const { data, error } = await supabaseClient
      .from('patient_form_assignments')
      .insert(assignmentData)
      .select(`
        *,
        patient:patients(id, first_name, last_name, email),
        form:form_definitions(id, form_name, category)
      `)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
