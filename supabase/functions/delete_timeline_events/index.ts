import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 delete_timeline_events function invoked');
  console.log('📝 Request method:', req.method);
  console.log('🌐 Request URL:', req.url);
  console.log('🔑 Authorization header present:', !!req.headers.get('Authorization'));
  console.log('🌍 Origin header:', req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    console.log('🔧 Creating Supabase clients...');
    console.log('🔍 SUPABASE_URL available:', !!Deno.env.get('SUPABASE_URL'));
    console.log('🔍 SUPABASE_ANON_KEY available:', !!Deno.env.get('SUPABASE_ANON_KEY'));

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

    console.log('✅ Supabase clients created');

    // Get the current user from the JWT token
    console.log('🔐 Getting user from JWT token...');
    console.log('🎫 Token format check:', req.headers.get('Authorization')?.substring(0, 20) + '...');

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      console.log('👤 User data:', user);
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
    console.log('👤 Fetching user profile...');
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

    // Get timeline event ID from request body (matching current API client pattern)
    console.log('📋 Parsing request body...');
    const requestBody = await req.json();
    const { id: event_id } = requestBody;

    console.log('📝 Request data:', { event_id });

    // Validate required fields
    if (!event_id) {
      console.error('❌ Missing timeline event ID');
      return new Response(
        JSON.stringify({
          error: 'Missing timeline event ID',
          details: 'Timeline event ID is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🗑️ Soft deleting timeline event:', event_id);

    // First, check if the event exists and belongs to the user's clinic
    const { data: existingEvent, error: checkError } = await supabaseClient
      .from('timeline_events')
      .select('id, clinic_id, is_deleted, event_type, title, patient_id, event_date')
      .eq('id', event_id)
      .eq('clinic_id', userProfile.clinic_id)
      .maybeSingle();

    console.log('🔍 Existing timeline event check:', { existingEvent, checkError });

    if (checkError) {
      console.error('❌ Error checking timeline event:', checkError);
      return new Response(
        JSON.stringify({
          error: 'Failed to verify timeline event',
          details: checkError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!existingEvent) {
      console.error('❌ Timeline event not found or access denied');
      return new Response(
        JSON.stringify({
          error: 'Timeline event not found or access denied',
          details: 'The timeline event may not exist or you may not have permission to delete it'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (existingEvent.is_deleted === true) {
      console.error('❌ Timeline event already deleted');
      return new Response(
        JSON.stringify({
          error: 'Timeline event already deleted',
          details: 'This timeline event has already been deleted'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Soft delete timeline event
    const { data: timelineEvent, error: deleteError } = await supabaseClient
      .from('timeline_events')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_by: userProfile.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', event_id)
      .eq('clinic_id', userProfile.clinic_id)
      .select('id')
      .maybeSingle();

    if (deleteError) {
      console.error('❌ Failed to delete timeline event:', deleteError);
      console.log('🔍 Error details:', JSON.stringify(deleteError, null, 2));
      return new Response(
        JSON.stringify({
          error: 'Failed to delete timeline event',
          details: deleteError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!timelineEvent) {
      console.error('❌ Timeline event not found after delete');
      return new Response(
        JSON.stringify({
          error: 'Failed to delete timeline event',
          details: 'Timeline event update did not complete'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Timeline event soft deleted successfully:', event_id);

    // If this is a Medication event, also delete the associated medication
    if (existingEvent.event_type === 'Medication') {
      console.log('💊 Timeline event is a medication, attempting to delete associated medication...');

      // Extract medication name from title (format: "Medication Added: {name}")
      const medicationName = existingEvent.title?.replace('Medication Added: ', '');

      if (medicationName) {
        console.log('🔍 Looking for medication:', medicationName);

        // Find and soft delete the medication
        const { data: medications, error: medError } = await supabaseClient
          .from('medications')
          .select('id')
          .eq('patient_id', existingEvent.patient_id)
          .eq('clinic_id', existingEvent.clinic_id)
          .eq('name', medicationName)
          .eq('is_deleted', false);

        if (medError) {
          console.error('⚠️ Error finding medication:', medError);
        } else if (medications && medications.length > 0) {
          console.log('✅ Found medications to delete:', medications.length);

          // Delete all matching medications (there should typically be just one)
          for (const med of medications) {
            const { error: delError } = await supabaseClient
              .from('medications')
              .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                updated_by: userProfile.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', med.id);

            if (delError) {
              console.error('⚠️ Error deleting medication:', delError);
            } else {
              console.log('✅ Medication soft deleted:', med.id);
            }
          }
        } else {
          console.log('ℹ️ No matching medication found');
        }
      }
    }

    // If this is a Supplement event, also delete the associated supplement
    if (existingEvent.event_type === 'Supplement') {
      console.log('💊 Timeline event is a supplement, attempting to delete associated supplement...');

      // Extract supplement name from title (format: "Supplement Added: {name}")
      const supplementName = existingEvent.title?.replace('Supplement Added: ', '');

      if (supplementName) {
        console.log('🔍 Looking for supplement:', supplementName);

        // Find and soft delete the supplement
        const { data: supplements, error: suppError } = await supabaseClient
          .from('supplements')
          .select('id')
          .eq('patient_id', existingEvent.patient_id)
          .eq('clinic_id', existingEvent.clinic_id)
          .eq('name', supplementName)
          .eq('is_deleted', false);

        if (suppError) {
          console.error('⚠️ Error finding supplement:', suppError);
        } else if (supplements && supplements.length > 0) {
          console.log('✅ Found supplements to delete:', supplements.length);

          // Delete all matching supplements (there should typically be just one)
          for (const supp of supplements) {
            const { error: delError } = await supabaseClient
              .from('supplements')
              .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                updated_by: userProfile.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', supp.id);

            if (delError) {
              console.error('⚠️ Error deleting supplement:', delError);
            } else {
              console.log('✅ Supplement soft deleted:', supp.id);
            }
          }
        } else {
          console.log('ℹ️ No matching supplement found');
        }
      }
    }

    console.log('📤 Sending success response');
    return new Response(
      JSON.stringify({
        message: 'Timeline event deleted successfully',
        success: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in delete_timeline_events:', error);
    console.log('🔍 Full error details:', JSON.stringify(error, null, 2));
    console.log('📊 Error stack:', error.stack);
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