import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 delete_labs function invoked');
  console.log('📝 Request method:', req.method);
  console.log('🌐 Request URL:', req.url);

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Create client for auth verification
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Create service role client for database operations (bypassing RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the current user from the JWT token
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          details: userError?.message || 'No valid user session'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Get user profile to get clinic_id
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('id, clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('❌ Failed to get user profile:', profileError);
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

    console.log('✅ User profile loaded:', { id: userProfile.id, clinic_id: userProfile.clinic_id });

    // Get lab ID from URL query parameter
    const url = new URL(req.url);
    const lab_id = url.searchParams.get('id');

    console.log('📝 Request data:', { lab_id });

    // Validate required fields
    if (!lab_id) {
      console.error('❌ Missing lab ID');
      return new Response(
        JSON.stringify({
          error: 'Missing lab ID',
          details: 'Lab ID is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🗑️ Soft deleting lab:', lab_id);

    // First, check if the lab exists and belongs to the user's clinic
    const { data: existingLab, error: checkError } = await supabaseClient
      .from('labs')
      .select('id, clinic_id, is_deleted')
      .eq('id', lab_id)
      .eq('clinic_id', userProfile.clinic_id)
      .maybeSingle();

    console.log('🔍 Existing lab check:', { existingLab, checkError });

    if (checkError) {
      console.error('❌ Error checking lab:', checkError);
      return new Response(
        JSON.stringify({
          error: 'Failed to verify lab',
          details: checkError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!existingLab) {
      console.error('❌ Lab not found or access denied');
      return new Response(
        JSON.stringify({
          error: 'Lab not found or access denied',
          details: 'The lab may not exist or you may not have permission to delete it'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (existingLab.is_deleted === true) {
      console.error('❌ Lab already deleted');
      return new Response(
        JSON.stringify({
          error: 'Lab already deleted',
          details: 'This lab has already been deleted'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Soft delete lab
    const { data: lab, error: deleteError } = await supabaseClient
      .from('labs')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_by: userProfile.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', lab_id)
      .eq('clinic_id', userProfile.clinic_id)
      .select('lab_name')
      .maybeSingle();

    if (deleteError) {
      console.error('❌ Failed to delete lab:', deleteError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete lab',
          details: deleteError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!lab) {
      console.error('❌ Lab not found after delete');
      return new Response(
        JSON.stringify({
          error: 'Failed to delete lab',
          details: 'Lab update did not complete'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Lab soft deleted successfully:', lab_id);

    // Also soft delete related timeline events
    console.log('🗑️ Soft deleting related timeline events...');
    const { error: timelineError } = await supabaseClient
      .from('timeline_events')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_by: userProfile.id,
        updated_at: new Date().toISOString()
      })
      .eq('clinic_id', userProfile.clinic_id)
      .ilike('title', `%Lab Added: ${lab.lab_name}%`);

    if (timelineError) {
      console.warn('⚠️ Failed to delete related timeline events:', timelineError);
      // Don't fail the whole operation if timeline deletion fails
    } else {
      console.log('✅ Related timeline events deleted');
    }

    return new Response(
      JSON.stringify({
        message: 'Lab deleted successfully',
        lab: lab,
        success: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in delete_labs:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});