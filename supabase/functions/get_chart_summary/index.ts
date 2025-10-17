import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      .maybeSingle();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const patient_id = url.searchParams.get('patient_id');

    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: 'patient_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all essential chart summary data in parallel
    const [vitalsData, allergiesData, problemsData, medicationsData, chiefComplaintsData] = await Promise.all([
      // Latest 5 vital signs
      supabaseClient
        .from('vital_signs')
        .select('id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate_bpm, temperature_c, weight_kg, bmi, oxygen_saturation, recorded_at')
        .eq('patient_id', patient_id)
        .eq('clinic_id', userProfile.clinic_id)
        .order('recorded_at', { ascending: false })
        .limit(5)
        .then(({ data, error }) => error ? [] : data),

      // Active allergies only
      supabaseClient
        .from('patient_allergies')
        .select('id, allergen, allergen_type, severity, reaction, status')
        .eq('patient_id', patient_id)
        .eq('clinic_id', userProfile.clinic_id)
        .eq('status', 'active')
        .then(({ data, error }) => error ? [] : data),

      // Active and chronic problems only
      supabaseClient
        .from('problem_list')
        .select('id, problem, icd10_code, status, severity, onset_date')
        .eq('patient_id', patient_id)
        .in('status', ['active', 'chronic'])
        .order('priority', { ascending: true })
        .limit(10)
        .then(({ data, error }) => error ? [] : data),

      // Active medications (simplified fields)
      supabaseClient
        .from('medications')
        .select('id, medication_name:name, status, start_date')
        .eq('patient_id', patient_id)
        .eq('clinic_id', userProfile.clinic_id)
        .eq('is_deleted', false)
        .order('start_date', { ascending: false })
        .limit(10)
        .then(({ data, error }) => error ? [] : data),

      // Recent 5 chief complaints for activity
      supabaseClient
        .from('chief_complaints')
        .select('id, complaint, visit_date, severity')
        .eq('patient_id', patient_id)
        .eq('clinic_id', userProfile.clinic_id)
        .order('visit_date', { ascending: false })
        .limit(5)
        .then(({ data, error }) => error ? [] : data),
    ]);

    // Check completeness status
    const [hpiCount, rosCount, physicalExamCount] = await Promise.all([
      supabaseClient
        .from('history_present_illness')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patient_id)
        .eq('clinic_id', userProfile.clinic_id)
        .then(({ count }) => count || 0),

      supabaseClient
        .from('review_of_systems')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patient_id)
        .eq('clinic_id', userProfile.clinic_id)
        .then(({ count }) => count || 0),

      supabaseClient
        .from('physical_exams')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patient_id)
        .eq('clinic_id', userProfile.clinic_id)
        .then(({ count }) => count || 0),
    ]);

    // Build recent activity from vital signs and chief complaints
    const recentActivity = [
      ...chiefComplaintsData.map((cc: any) => ({
        type: 'Chief Complaint',
        description: cc.complaint,
        date: cc.visit_date,
      })),
      ...vitalsData.map((v: any) => ({
        type: 'Vital Signs',
        description: 'Vital signs recorded',
        date: v.recorded_at,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Build completeness array
    const completeness = [
      { section: 'Chief Complaints', status: chiefComplaintsData.length > 0 ? 'complete' : 'empty' },
      { section: 'HPI', status: hpiCount > 0 ? 'complete' : 'empty' },
      { section: 'ROS', status: rosCount > 0 ? 'complete' : 'empty' },
      { section: 'Vital Signs', status: vitalsData.length > 0 ? 'complete' : 'empty' },
      { section: 'Allergies', status: allergiesData.length > 0 ? 'complete' : 'empty' },
      { section: 'Problems', status: problemsData.length > 0 ? 'complete' : 'empty' },
      { section: 'Medications', status: medicationsData.length > 0 ? 'complete' : 'empty' },
      { section: 'Physical Exam', status: physicalExamCount > 0 ? 'complete' : 'empty' },
    ];

    const summary = {
      vitalSigns: vitalsData,
      allergies: allergiesData,
      problems: problemsData,
      medications: medicationsData,
      recentActivity,
      completeness,
    };

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get_chart_summary:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});