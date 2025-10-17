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
    const attendanceRecords = body.attendance_records || []; // Array of {patient_id, attended, notes}

    if (!body.group_id || !body.session_date) {
      return new Response(
        JSON.stringify({ error: 'group_id and session_date are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    const errors = [];

    for (const record of attendanceRecords) {
      const attendanceData = {
        clinic_id: userProfile.clinic_id,
        group_id: body.group_id,
        resource_booking_id: body.resource_booking_id || null,
        patient_id: record.patient_id,
        session_date: body.session_date,
        attended: record.attended,
        attendance_notes: record.notes || null,
        marked_by: userProfile.id,
        marked_at: new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('group_session_attendance')
        .upsert(attendanceData, {
          onConflict: 'group_id,resource_booking_id,patient_id'
        })
        .select()
        .single();

      if (error) {
        errors.push({ patient_id: record.patient_id, error: error.message });
      } else {
        results.push(data);

        // Update assignment attendance count if attended
        if (record.attended) {
          await supabaseClient.rpc('increment_attendance_count', {
            p_group_id: body.group_id,
            p_patient_id: record.patient_id,
            p_session_date: body.session_date
          }).catch(() => {
            // Fallback: manual update
            supabaseClient
              .from('patient_group_assignments')
              .update({
                sessions_attended: supabaseClient.raw('sessions_attended + 1'),
                last_attendance_date: body.session_date
              })
              .eq('group_id', body.group_id)
              .eq('patient_id', record.patient_id)
              .eq('status', 'active');
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: results.length,
        failed: errors.length,
        results,
        errors
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
