import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 delete_medications function invoked');
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

    // Get medication ID from URL query parameter
    const url = new URL(req.url);
    const medication_id = url.searchParams.get('id');

    console.log('📝 Request data:', { medication_id });

    // Validate required fields
    if (!medication_id) {
      console.error('❌ Missing medication ID');
      return new Response(
        JSON.stringify({
          error: 'Missing medication ID',
          details: 'Medication ID is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🗑️ Soft deleting medication:', medication_id);

    // First, check if the medication exists and belongs to the user's clinic
    const { data: existingMedication, error: checkError } = await supabaseClient
      .from('medications')
      .select('id, clinic_id, is_deleted')
      .eq('id', medication_id)
      .eq('clinic_id', userProfile.clinic_id)
      .maybeSingle();

    console.log('🔍 Existing medication check:', { existingMedication, checkError });

    if (checkError) {
      console.error('❌ Error checking medication:', checkError);
      return new Response(
        JSON.stringify({
          error: 'Failed to verify medication',
          details: checkError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!existingMedication) {
      console.error('❌ Medication not found or access denied');
      return new Response(
        JSON.stringify({
          error: 'Medication not found or access denied',
          details: 'The medication may not exist or you may not have permission to delete it'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (existingMedication.is_deleted === true) {
      console.error('❌ Medication already deleted');
      return new Response(
        JSON.stringify({
          error: 'Medication already deleted',
          details: 'This medication has already been deleted'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Soft delete medication
    const { data: medication, error: deleteError } = await supabaseClient
      .from('medications')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_by: userProfile.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', medication_id)
      .eq('clinic_id', userProfile.clinic_id)
      .select('name')
      .maybeSingle();

    if (deleteError) {
      console.error('❌ Failed to delete medication:', deleteError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete medication',
          details: deleteError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!medication) {
      console.error('❌ Medication not found after delete');
      return new Response(
        JSON.stringify({
          error: 'Failed to delete medication',
          details: 'Medication update did not complete'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Medication soft deleted successfully:', medication_id);

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
      .ilike('title', `%Medication Added: ${medication.name}%`);

    if (timelineError) {
      console.warn('⚠️ Failed to delete related timeline events:', timelineError);
      // Don't fail the whole operation if timeline deletion fails
    } else {
      console.log('✅ Related timeline events deleted');
    }

    return new Response(
      JSON.stringify({
        message: 'Medication deleted successfully',
        medication: medication,
        success: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in delete_medications:', error);
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