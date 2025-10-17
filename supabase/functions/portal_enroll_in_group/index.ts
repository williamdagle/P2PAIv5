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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: patient, error: patientError } = await supabaseClient
      .from('patients')
      .select('id, clinic_id, first_name, last_name')
      .eq('email', user.email)
      .single();

    if (patientError || !patient) {
      return new Response(
        JSON.stringify({ error: 'Patient not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    // Verify group allows self-enrollment and has capacity
    const { data: group, error: groupError } = await supabaseClient
      .from('patient_groups')
      .select('id, name, allow_self_enrollment, max_members, current_member_count, status')
      .eq('id', body.group_id)
      .eq('clinic_id', patient.clinic_id)
      .single();

    if (groupError || !group) {
      return new Response(
        JSON.stringify({ error: 'Group not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!group.allow_self_enrollment) {
      return new Response(
        JSON.stringify({ error: 'This group does not allow self-enrollment' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (group.status !== 'forming' && group.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'This group is not currently accepting enrollments' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (group.max_members && group.current_member_count >= group.max_members) {
      return new Response(
        JSON.stringify({ error: 'This group is at full capacity' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing enrollment
    const { data: existing } = await supabaseClient
      .from('patient_group_assignments')
      .select('id, status')
      .eq('patient_id', patient.id)
      .eq('group_id', body.group_id)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') {
        return new Response(
          JSON.stringify({ error: 'You are already enrolled in this group' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create enrollment
    const assignmentData = {
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      group_id: body.group_id,
      assignment_date: new Date().toISOString().split('T')[0],
      status: 'active',
      individual_session_completed: false,
      notes: 'Self-enrolled via patient portal'
    };

    const { data: assignment, error: assignmentError } = await supabaseClient
      .from('patient_group_assignments')
      .insert(assignmentData)
      .select()
      .single();

    if (assignmentError) {
      return new Response(
        JSON.stringify({ error: assignmentError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        assignment_id: assignment.id,
        group_name: group.name,
        message: `Successfully enrolled in ${group.name}`
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
