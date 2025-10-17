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

    // Check group capacity
    const { data: groupData, error: groupError } = await supabaseClient
      .from('patient_groups')
      .select('max_members, current_member_count')
      .eq('id', body.group_id)
      .single();

    if (groupError) {
      return new Response(
        JSON.stringify({ error: 'Group not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (groupData.max_members && groupData.current_member_count >= groupData.max_members) {
      return new Response(
        JSON.stringify({ error: 'Group is at maximum capacity' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const assignmentData = {
      clinic_id: userProfile.clinic_id,
      patient_id: body.patient_id,
      group_id: body.group_id,
      assignment_date: body.assignment_date || new Date().toISOString().split('T')[0],
      assigned_by: userProfile.id,
      status: 'active',
      individual_session_completed: body.individual_session_completed || false,
      individual_session_date: body.individual_session_date || null,
      notes: body.notes || null
    };

    const { data, error } = await supabaseClient
      .from('patient_group_assignments')
      .insert(assignmentData)
      .select()
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
