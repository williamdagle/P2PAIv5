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

    const url = new URL(req.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { full_name, role_id, password } = await req.json();

    const updateData: any = {};
    if (full_name) updateData.full_name = full_name;
    if (role_id) updateData.role_id = role_id;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedUser, error: updateError } = await supabaseClient
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id,
        email,
        full_name,
        role_id,
        clinic_id,
        auth_user_id,
        roles!role_id(name)
      `)
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update user', details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (password && updatedUser.auth_user_id) {
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { error: passwordError } = await serviceClient.auth.admin.updateUserById(
        updatedUser.auth_user_id,
        { password }
      );

      if (passwordError) {
        console.error('Failed to update password:', passwordError);
      }
    }

    const transformedUser = {
      ...updatedUser,
      role: updatedUser.roles?.name || 'Unknown'
    };

    return new Response(JSON.stringify(transformedUser), {
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
