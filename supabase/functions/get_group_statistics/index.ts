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
    const group_id = url.searchParams.get('group_id');

    if (!group_id) {
      return new Response(
        JSON.stringify({ error: 'group_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get group info
    const { data: group, error: groupError } = await supabaseClient
      .from('patient_groups')
      .select('*')
      .eq('id', group_id)
      .eq('clinic_id', userProfile.clinic_id)
      .single();

    if (groupError || !group) {
      return new Response(
        JSON.stringify({ error: 'Group not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get assignment statistics
    const { data: assignments } = await supabaseClient
      .from('patient_group_assignments')
      .select('status, sessions_attended')
      .eq('group_id', group_id);

    const totalAssignments = assignments?.length || 0;
    const activeMembers = assignments?.filter(a => a.status === 'active').length || 0;
    const completedMembers = assignments?.filter(a => a.status === 'completed').length || 0;
    const withdrawnMembers = assignments?.filter(a => a.status === 'withdrawn').length || 0;
    const totalSessions = assignments?.reduce((sum, a) => sum + (a.sessions_attended || 0), 0) || 0;

    // Get attendance statistics
    const { data: attendanceRecords } = await supabaseClient
      .from('group_session_attendance')
      .select('attended, session_date')
      .eq('group_id', group_id);

    const totalAttendanceRecords = attendanceRecords?.length || 0;
    const attendedCount = attendanceRecords?.filter(a => a.attended).length || 0;
    const uniqueSessions = new Set(attendanceRecords?.map(a => a.session_date)).size;

    const statistics = {
      group_info: {
        id: group.id,
        name: group.name,
        status: group.status,
        current_member_count: group.current_member_count,
        max_members: group.max_members
      },
      membership: {
        total_assignments: totalAssignments,
        active_members: activeMembers,
        completed_members: completedMembers,
        withdrawn_members: withdrawnMembers,
        capacity_utilization: group.max_members ? (activeMembers / group.max_members * 100).toFixed(1) : 'unlimited'
      },
      attendance: {
        total_sessions_held: uniqueSessions,
        total_attendance_records: totalAttendanceRecords,
        total_attended: attendedCount,
        total_sessions_by_all_members: totalSessions,
        average_attendance_rate: totalAttendanceRecords > 0 ? (attendedCount / totalAttendanceRecords * 100).toFixed(1) : 0,
        average_sessions_per_member: activeMembers > 0 ? (totalSessions / activeMembers).toFixed(1) : 0
      },
      completion: {
        completion_rate: totalAssignments > 0 ? (completedMembers / totalAssignments * 100).toFixed(1) : 0,
        withdrawal_rate: totalAssignments > 0 ? (withdrawnMembers / totalAssignments * 100).toFixed(1) : 0
      }
    };

    return new Response(
      JSON.stringify(statistics),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
