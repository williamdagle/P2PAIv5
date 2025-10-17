import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user profile with role information
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('id, clinic_id, role:roles(name)')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Only system admins can create categories
    if (userProfile.role?.name !== 'System Admin') {
      return new Response(
        JSON.stringify({ error: 'Only system administrators can create categories' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await req.json();
    const { name, description, color, icon, is_active = true, sort_order = 0 } = body;

    // Validation
    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: name' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare insert data
    const insertData = {
      clinic_id: userProfile.clinic_id,
      name,
      description: description || null,
      color: color || null,
      icon: icon || null,
      is_active,
      sort_order,
      created_by: userProfile.id
    };

    // Insert category
    const { data: category, error: insertError } = await supabaseClient
      .from('note_categories')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating category:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create category', details: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify(category),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in create_note_categories:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
