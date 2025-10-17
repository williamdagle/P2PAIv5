import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 get_note_templates function invoked');
  console.log('📝 Request method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user profile to get clinic_id
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('id, clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({
          error: 'User profile not found',
          details: profileError?.message
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get query parameters for filtering
    const url = new URL(req.url);
    const filter = url.searchParams.get('filter') || 'all';

    // Build query based on filter
    let templatesQuery = supabaseClient
      .from('note_templates')
      .select(`
        id,
        name,
        template_type,
        structure,
        description,
        is_active,
        is_personal,
        owner_user_id,
        created_at,
        created_by_user:users!created_by(full_name)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Apply filter: RLS policies will handle security, but we add additional filters for UI
    if (filter === 'clinic') {
      // Show only clinic-wide templates (not personal)
      templatesQuery = templatesQuery.eq('is_personal', false);
    } else if (filter === 'personal') {
      // Show only personal templates owned by current user
      templatesQuery = templatesQuery
        .eq('is_personal', true)
        .eq('owner_user_id', userProfile.id);
    }
    // 'all' shows both clinic and personal templates (RLS handles security)

    const { data: templates, error: templatesError } = await templatesQuery;

    if (templatesError) {
      console.error('Error fetching note templates:', templatesError);
      
      // If table doesn't exist, return empty array so frontend can use fallbacks
      if (templatesError.message?.includes('relation "note_templates" does not exist')) {
        console.log('📋 note_templates table does not exist, returning empty array for fallback');
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch note templates' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Note templates fetched successfully:', templates?.length || 0);

    return new Response(JSON.stringify(templates || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_note_templates:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
