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

    // Get patient with state info
    const { data: patient, error: patientError } = await supabaseClient
      .from('patients')
      .select('id, clinic_id, address')
      .eq('email', user.email)
      .single();

    if (patientError || !patient) {
      return new Response(
        JSON.stringify({ error: 'Patient not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get patient's state from state history
    const { data: stateHistory } = await supabaseClient
      .from('patient_state_history')
      .select('state_code')
      .eq('patient_id', patient.id)
      .eq('is_primary_state', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const patientState = stateHistory?.state_code;

    // Get available groups
    let query = supabaseClient
      .from('patient_groups')
      .select(`
        id,
        name,
        description,
        group_type,
        session_frequency,
        session_duration_minutes,
        max_members,
        current_member_count,
        start_date,
        end_date,
        requires_individual_session,
        group_materials,
        provider:users!provider_id(full_name)
      `)
      .eq('clinic_id', patient.clinic_id)
      .eq('portal_visible', true)
      .eq('allow_self_enrollment', true)
      .in('status', ['forming', 'active'])
      .order('name', { ascending: true });

    const { data: groups, error: groupsError } = await query;

    if (groupsError) {
      return new Response(
        JSON.stringify({ error: groupsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter groups by state restrictions and capacity
    const availableGroups = (groups || []).filter(group => {
      // Check state restrictions
      const stateRestrictions = group.state_restrictions as string[] || [];
      if (stateRestrictions.length > 0 && patientState) {
        if (!stateRestrictions.includes(patientState)) {
          return false;
        }
      }

      // Check capacity
      if (group.max_members && group.current_member_count >= group.max_members) {
        return false;
      }

      return true;
    });

    // Check if patient is already enrolled in any groups
    const { data: existingAssignments } = await supabaseClient
      .from('patient_group_assignments')
      .select('group_id')
      .eq('patient_id', patient.id)
      .eq('status', 'active');

    const enrolledGroupIds = new Set(existingAssignments?.map(a => a.group_id) || []);

    const enrichedGroups = availableGroups.map(group => ({
      ...group,
      is_enrolled: enrolledGroupIds.has(group.id),
      spots_remaining: group.max_members ? group.max_members - group.current_member_count : null
    }));

    return new Response(
      JSON.stringify(enrichedGroups),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
