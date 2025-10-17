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

    const ruleData = {
      clinic_id: userProfile.clinic_id,
      organization_id: (userProfile as any).organization_id?.organization_id || null,
      form_definition_id: body.form_definition_id,
      rule_name: body.rule_name,
      trigger_type: body.trigger_type,
      trigger_conditions: body.trigger_conditions || {},
      auto_assign: body.auto_assign !== undefined ? body.auto_assign : true,
      assignment_priority: body.assignment_priority || 'medium',
      due_days_offset: body.due_days_offset || 7,
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_by: userProfile.id
    };

    const { data, error } = await supabaseClient
      .from('form_publication_rules')
      .insert(ruleData)
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
