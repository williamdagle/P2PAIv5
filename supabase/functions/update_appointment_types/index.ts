import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('clinic_id, id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userData) {
      throw new Error('User profile not found');
    }

    const body = await req.json();

    if (!body.id) {
      throw new Error('Appointment type ID is required');
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.color_code !== undefined) updateData.color_code = body.color_code;
    if (body.default_duration_minutes !== undefined) updateData.default_duration_minutes = body.default_duration_minutes;
    if (body.is_billable !== undefined) updateData.is_billable = body.is_billable;
    if (body.requires_approval !== undefined) updateData.requires_approval = body.requires_approval;
    if (body.max_free_sessions !== undefined) updateData.max_free_sessions = body.max_free_sessions;
    if (body.approval_roles !== undefined) updateData.approval_role_names = body.approval_roles;
    if (Object.keys(updateData).length > 0) updateData.updated_by = userData.id;

    const { data: appointmentType, error: updateError } = await supabase
      .from('appointment_types')
      .update(updateData)
      .eq('id', body.id)
      .eq('clinic_id', userData.clinic_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify(appointmentType),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
