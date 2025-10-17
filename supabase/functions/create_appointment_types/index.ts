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
      .select('clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userData) {
      throw new Error('User profile not found');
    }

    const body = await req.json();

    const appointmentTypeData = {
      clinic_id: userData.clinic_id,
      name: body.name,
      description: body.description || null,
      color_code: body.color_code || '#3B82F6',
      default_duration_minutes: body.default_duration_minutes || 60,
      is_billable: body.is_billable ?? true,
      requires_approval: body.requires_approval ?? false,
      max_free_sessions: body.max_free_sessions || 0,
      approval_role_names: body.approval_roles || [],
      created_by: userData.id
    };

    const { data: appointmentType, error: insertError } = await supabase
      .from('appointment_types')
      .insert([appointmentTypeData])
      .select()
      .single();

    if (insertError) {
      throw insertError;
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
