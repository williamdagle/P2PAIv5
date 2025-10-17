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

    // End any active state assignments
    await supabaseClient
      .from('patient_state_history')
      .update({ end_date: new Date().toISOString().split('T')[0] })
      .eq('patient_id', body.patient_id)
      .is('end_date', null);

    // Get state configuration and required forms
    const { data: stateConfig } = await supabaseClient
      .from('state_configurations')
      .select('required_forms')
      .eq('clinic_id', userProfile.clinic_id)
      .eq('state_code', body.state_code)
      .eq('is_active', true)
      .single();

    const formsTriggered = stateConfig?.required_forms || [];

    // Create new state history record
    const stateHistoryData = {
      clinic_id: userProfile.clinic_id,
      patient_id: body.patient_id,
      state_code: body.state_code,
      is_primary_state: true,
      effective_date: body.effective_date || new Date().toISOString().split('T')[0],
      change_reason: body.change_reason || null,
      detected_from: body.detected_from || 'manual',
      forms_triggered: formsTriggered,
      recorded_by: userProfile.id
    };

    const { data: stateHistory, error: stateError } = await supabaseClient
      .from('patient_state_history')
      .insert(stateHistoryData)
      .select()
      .single();

    if (stateError) {
      return new Response(
        JSON.stringify({ error: stateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auto-assign forms based on state configuration
    if (formsTriggered.length > 0) {
      const formAssignments = [];

      for (const formId of formsTriggered) {
        // Get form definition to find current version
        const { data: formDef } = await supabaseClient
          .from('form_definitions')
          .select('id, current_version_id')
          .eq('id', formId)
          .single();

        if (formDef && formDef.current_version_id) {
          formAssignments.push({
            clinic_id: userProfile.clinic_id,
            patient_id: body.patient_id,
            form_definition_id: formDef.id,
            form_version_id: formDef.current_version_id,
            assigned_by: userProfile.id,
            assigned_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'high',
            status: 'assigned',
            assignment_reason: `Required for ${body.state_code} state compliance`
          });
        }
      }

      if (formAssignments.length > 0) {
        await supabaseClient
          .from('patient_form_assignments')
          .insert(formAssignments);
      }
    }

    return new Response(
      JSON.stringify({
        state_history: stateHistory,
        forms_assigned: formsTriggered.length
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
