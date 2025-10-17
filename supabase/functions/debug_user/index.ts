import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const email = url.searchParams.get('email') || 'patient@testclinic.com';

    // Get user with clinic and organization info
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select(`
        *,
        clinics (
          *,
          organizations (*)
        ),
        roles (*)
      `)
      .eq('email', email)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found', details: userError }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({
      user: userData,
      summary: {
        email: userData.email,
        full_name: userData.full_name,
        clinic_name: userData.clinics?.name,
        clinic_type: userData.clinics?.clinic_type,
        organization_name: userData.clinics?.organizations?.name,
        role_name: userData.roles?.name
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in debug_user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});