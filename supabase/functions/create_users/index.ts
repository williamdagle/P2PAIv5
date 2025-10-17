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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user: authUser },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role_id, roles!role_id(name)')
      .eq('auth_user_id', authUser.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (userProfile.roles?.name !== 'System Admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. System Admin role required.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, full_name, role_id, clinic_id, password } = await req.json();

    const newErrors: string[] = [];
    if (!email) newErrors.push('email is required');
    if (!full_name) newErrors.push('full_name is required');
    if (!role_id) newErrors.push('role_id is required');
    if (!clinic_id) newErrors.push('clinic_id is required');
    if (!password) newErrors.push('password is required');

    if (newErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: newErrors.join(', ') }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: newAuthUser, error: createAuthError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createAuthError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user', details: createAuthError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: newUser, error: createError } = await serviceClient
      .from('users')
      .insert({
        auth_user_id: newAuthUser.user.id,
        email,
        full_name,
        role_id,
        clinic_id
      })
      .select(`
        id,
        email,
        full_name,
        role_id,
        clinic_id,
        created_at,
        roles!role_id(name)
      `)
      .single();

    if (createError) {
      await serviceClient.auth.admin.deleteUser(newAuthUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: createError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const transformedUser = {
      ...newUser,
      role: newUser.roles?.name || 'Unknown'
    };

    return new Response(JSON.stringify(transformedUser), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
