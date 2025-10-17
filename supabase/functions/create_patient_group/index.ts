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
      .select('id, clinic_id, organization_id:clinics!inner(organization_id)')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    const groupData = {
      clinic_id: userProfile.clinic_id,
      organization_id: (userProfile as any).organization_id?.organization_id || null,
      name: body.name,
      description: body.description,
      group_type: body.group_type || 'support',
      state_restrictions: body.state_restrictions || [],
      eligibility_criteria: body.eligibility_criteria || {},
      session_frequency: body.session_frequency || 'weekly',
      session_duration_minutes: body.session_duration_minutes || 60,
      resource_id: body.resource_id || null,
      provider_id: body.provider_id || null,
      max_members: body.max_members || null,
      status: body.status || 'forming',
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      portal_visible: body.portal_visible !== undefined ? body.portal_visible : true,
      allow_self_enrollment: body.allow_self_enrollment || false,
      requires_individual_session: body.requires_individual_session || false,
      group_materials: body.group_materials || [],
      communication_settings: body.communication_settings || {},
      created_by: userProfile.id
    };

    const { data, error } = await supabaseClient
      .from('patient_groups')
      .insert(groupData)
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
