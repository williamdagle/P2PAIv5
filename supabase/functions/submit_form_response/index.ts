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
    const isComplete = body.is_complete !== false; // default to true if not specified
    const isPartialSave = !isComplete;

    const submissionData = {
      clinic_id: userProfile.clinic_id,
      patient_id: body.patient_id,
      form_assignment_id: body.form_assignment_id || null,
      form_definition_id: body.form_definition_id,
      form_version_id: body.form_version_id,
      form_responses: body.form_responses || {},
      submission_source: body.submission_source || 'staff_assisted',
      is_complete: isComplete,
      is_partial_save: isPartialSave,
      ip_address: body.ip_address || null,
      user_agent: body.user_agent || null,
      signature_data: body.signature_data || null,
      submitted_by_user_id: userProfile.id,
      submitted_at: isComplete ? new Date().toISOString() : null
    };

    const { data: submission, error: submissionError } = await supabaseClient
      .from('patient_form_submissions')
      .insert(submissionData)
      .select()
      .single();

    if (submissionError) {
      return new Response(
        JSON.stringify({ error: submissionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If complete and linked to assignment, update assignment status
    if (isComplete && body.form_assignment_id) {
      await supabaseClient
        .from('patient_form_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', body.form_assignment_id);
    } else if (isPartialSave && body.form_assignment_id) {
      // Update to in_progress if it was assigned
      await supabaseClient
        .from('patient_form_assignments')
        .update({ status: 'in_progress' })
        .eq('id', body.form_assignment_id)
        .eq('status', 'assigned');
    }

    return new Response(
      JSON.stringify(submission),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
