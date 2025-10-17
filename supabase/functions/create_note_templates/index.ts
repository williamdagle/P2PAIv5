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

    const isSystemAdmin = userProfile.role?.name === 'System Admin';

    const body = await req.json();
    const { name, template_type, structure, description, is_personal, is_active = true } = body;

    // Validation
    if (!name || !template_type || !structure) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, template_type, structure' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If trying to create clinic-wide template, must be system admin
    if (!is_personal && !isSystemAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only system administrators can create clinic-wide templates' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare insert data
    const insertData: any = {
      clinic_id: userProfile.clinic_id,
      name,
      template_type,
      structure,
      description: description || null,
      is_active,
      is_personal: is_personal || false,
      created_by: userProfile.id
    };

    // If personal template, set owner_user_id
    if (is_personal) {
      insertData.owner_user_id = userProfile.id;
    }

    // Insert template
    const { data: template, error: insertError } = await supabaseClient
      .from('note_templates')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating template:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create template', details: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify(template),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in create_note_templates:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
