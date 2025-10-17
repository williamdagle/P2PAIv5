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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get patient
    const { data: patient, error: patientError } = await supabaseClient
      .from('patients')
      .select('id, clinic_id')
      .eq('email', user.email)
      .single();

    if (patientError || !patient) {
      return new Response(
        JSON.stringify({ error: 'Patient not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const isComplete = body.is_complete !== false;
    const isPartialSave = !isComplete;

    // Get client IP from headers (Cloudflare/proxy safe)
    const ip = req.headers.get('cf-connecting-ip') ||
               req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';

    const submissionData = {
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      form_assignment_id: body.form_assignment_id,
      form_definition_id: body.form_definition_id,
      form_version_id: body.form_version_id,
      form_responses: body.form_responses || {},
      submission_source: 'patient_portal',
      is_complete: isComplete,
      is_partial_save: isPartialSave,
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || null,
      signature_data: body.signature_data || null,
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

    // Update assignment status
    if (isComplete && body.form_assignment_id) {
      await supabaseClient
        .from('patient_form_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', body.form_assignment_id);
    } else if (isPartialSave && body.form_assignment_id) {
      await supabaseClient
        .from('patient_form_assignments')
        .update({ status: 'in_progress' })
        .eq('id', body.form_assignment_id)
        .eq('status', 'assigned');
    }

    return new Response(
      JSON.stringify({
        success: true,
        submission_id: submission.id,
        is_complete: isComplete
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
