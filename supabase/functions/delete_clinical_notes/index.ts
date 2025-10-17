import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 delete_clinical_notes function invoked');
  console.log('📝 Request method:', req.method);

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

    // Get note ID from URL
    const url = new URL(req.url);
    const noteId = url.searchParams.get('id');

    if (!noteId) {
      return new Response(
        JSON.stringify({
          error: 'Missing note ID',
          details: 'Note ID is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Soft delete clinical note
    const { data: clinicalNote, error: deleteError } = await supabaseClient
      .from('clinical_notes')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_by: userProfile.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .eq('clinic_id', userProfile.clinic_id)
      .eq('is_deleted', false)
      .select(`
        id,
        title,
        note_type,
        category,
        note_date,
        patient_id,
        provider_id,
        is_deleted,
        deleted_at,
        patients!inner(first_name, last_name),
        provider:users!provider_id(full_name)
      `)
      .single();

    if (deleteError) {
      console.error('❌ Failed to delete clinical note:', deleteError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete clinical note',
          details: deleteError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!clinicalNote) {
      return new Response(
        JSON.stringify({
          error: 'Clinical note not found or access denied',
          details: 'The note may not exist, may already be deleted, or you may not have permission to delete it'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const transformedNote = {
      ...clinicalNote,
      patient_name: `${clinicalNote.patients.first_name} ${clinicalNote.patients.last_name}`,
      provider_name: clinicalNote.provider?.full_name || 'Unknown Provider'
    };

    return new Response(
      JSON.stringify({
        message: 'Clinical note deleted successfully',
        clinical_note: transformedNote,
        success: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in delete_clinical_notes:', error);
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