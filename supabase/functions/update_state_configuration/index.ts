import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS'
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
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.state_name) updateData.state_name = body.state_name;
    if (body.legal_requirements !== undefined) updateData.legal_requirements = body.legal_requirements;
    if (body.required_forms !== undefined) updateData.required_forms = body.required_forms;
    if (body.validation_rules !== undefined) updateData.validation_rules = body.validation_rules;
    if (body.data_retention_days !== undefined) updateData.data_retention_days = body.data_retention_days;
    if (body.compliance_notes !== undefined) updateData.compliance_notes = body.compliance_notes;
    if (body.last_review_date !== undefined) updateData.last_review_date = body.last_review_date;
    if (body.next_review_date !== undefined) updateData.next_review_date = body.next_review_date;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data, error } = await supabaseClient
      .from('state_configurations')
      .update(updateData)
      .eq('id', body.id)
      .eq('clinic_id', userProfile.clinic_id)
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
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
