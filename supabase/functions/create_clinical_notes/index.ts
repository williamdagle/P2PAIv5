import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// Helper function to create timeline events
async function createTimelineEvent(
  supabaseClient: any,
  eventData: {
    patient_id: string;
    clinic_id: string;
    event_type: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    provider_id: string;
    outcome?: string;
  }
): Promise<boolean> {
  try {
    console.log('📅 Creating timeline event:', eventData.title);
    
    const { data: timelineEvent, error: timelineError } = await supabaseClient
      .from('timeline_events')
      .insert({
        patient_id: eventData.patient_id,
        clinic_id: eventData.clinic_id,
        event_date: new Date().toISOString().split('T')[0], // Today's date
        event_type: eventData.event_type,
        title: eventData.title,
        description: eventData.description,
        severity: eventData.severity,
        provider_id: eventData.provider_id,
        outcome: eventData.outcome || null,
        created_by: eventData.provider_id,
        is_deleted: false
      })
      .select('id')
      .single();

    if (timelineError) {
      console.error('❌ Timeline event creation failed:', timelineError);
      return false;
    }

    console.log('✅ Timeline event created successfully:', timelineEvent.id);
    return true;
  } catch (error) {
    console.error('💥 Timeline event creation error:', error);
    return false;
  }
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Helper function to process provider note content for timeline events
async function processProviderNoteForTimeline(
  supabaseClient: any,
  noteData: any,
  userProfile: any
): Promise<void> {
  if (noteData.note_type !== 'provider_note' || !noteData.content) {
    return;
  }

  console.log('🔍 Processing provider note for timeline events...');
  console.log('📝 Note content keys:', Object.keys(noteData.content));

  // Check for SOAP template plan field
  if (noteData.content.plan && noteData.content.plan.trim()) {
    console.log('📋 Found SOAP plan content, creating timeline event');
    
    const planDescription = truncateText(noteData.content.plan, 200);
    
    await createTimelineEvent(supabaseClient, {
      patient_id: noteData.patient_id,
      clinic_id: userProfile.clinic_id,
      event_type: 'Treatment',
      title: 'Treatment Plan Documented (SOAP)',
      description: planDescription,
      severity: 'medium',
      provider_id: noteData.provider_id,
      outcome: 'Treatment plan documented in provider note'
    });
  }

  // Check for Initial Consultation treatment_plan field
  if (noteData.content.treatment_plan && noteData.content.treatment_plan.trim()) {
    console.log('📋 Found Initial Consultation treatment plan, creating timeline event');
    
    const treatmentDescription = truncateText(noteData.content.treatment_plan, 200);
    
    await createTimelineEvent(supabaseClient, {
      patient_id: noteData.patient_id,
      clinic_id: userProfile.clinic_id,
      event_type: 'Treatment',
      title: 'Initial Treatment Plan Established',
      description: treatmentDescription,
      severity: 'high',
      provider_id: noteData.provider_id,
      outcome: 'Initial treatment strategy documented'
    });
  }

  // Check for Enhanced SOAP treatment_plan field
  if (noteData.content.treatment_plan && noteData.content.treatment_plan.trim()) {
    console.log('📋 Found Enhanced SOAP treatment plan, creating timeline event');
    
    const enhancedTreatmentDescription = truncateText(noteData.content.treatment_plan, 200);
    
    await createTimelineEvent(supabaseClient, {
      patient_id: noteData.patient_id,
      clinic_id: userProfile.clinic_id,
      event_type: 'Treatment',
      title: 'Treatment Plan Updated (Enhanced SOAP)',
      description: enhancedTreatmentDescription,
      severity: 'medium',
      provider_id: noteData.provider_id,
      outcome: 'Treatment plan updated in provider note'
    });
  }

  console.log('✅ Provider note timeline processing complete');
}

Deno.serve(async (req) => {
  console.log('🚀 create_clinical_notes function invoked');
  console.log('📝 Request method:', req.method);
  console.log('🌐 Request URL:', req.url);
  console.log('🔑 Authorization header present:', !!req.headers.get('Authorization'));

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
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

    // Get the current user from the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

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

    // Parse request body
    const requestBody = await req.json();
    const { 
      patient_id,
      title,
      note_type,
      template_id,
      category,
      content,
      raw_content,
      note_date,
      provider_id
    } = requestBody;

    console.log('📝 Request data:', {
      patient_id,
      title,
      note_type,
      template_id,
      category
    });

    // Validation
    const newErrors: string[] = [];
    if (!patient_id) newErrors.push('patient_id is required');
    if (!title) newErrors.push('title is required');
    if (!note_type) newErrors.push('note_type is required');
    if (!['provider_note', 'quick_note'].includes(note_type)) {
      newErrors.push('note_type must be either provider_note or quick_note');
    }
    if (!note_date) newErrors.push('note_date is required');
    if (!provider_id) newErrors.push('provider_id is required');

    // Type-specific validation
    if (note_type === 'quick_note' && !category) {
      newErrors.push('category is required for quick notes');
    }

    if (newErrors.length > 0) {
      console.error('❌ Validation errors:', newErrors);
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: newErrors.join(', ')
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate note date
    const noteDate = new Date(note_date);
    if (noteDate > new Date()) {
      console.error('❌ Invalid note date - cannot be in the future');
      return new Response(
        JSON.stringify({
          error: 'Invalid note date',
          details: 'Note date cannot be in the future'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📝 Creating clinical note with data:', {
      patient_id,
      title,
      note_type,
      clinic_id: userProfile.clinic_id
    });

    // Prepare content field - content column is NOT NULL, so we need to provide a value
    // For quick notes, use raw_content; for provider notes, use a summary or raw_content
    let contentValue = raw_content || '';
    if (note_type === 'provider_note' && content) {
      // For provider notes with structured content, create a text summary
      contentValue = Object.values(content).filter(v => v).join('\n\n') || raw_content || '';
    }

    // Create clinical note
    const { data: clinicalNote, error: createError } = await supabaseClient
      .from('clinical_notes')
      .insert({
        patient_id,
        clinic_id: userProfile.clinic_id,
        provider_id,
        title,
        note_type,
        template_id: template_id || null,
        category: category || null,
        content: contentValue,
        structured_content: content || null,
        raw_content: raw_content || null,
        note_date,
        created_by: userProfile.id,
        is_deleted: false
      })
      .select(`
        id,
        title,
        note_type,
        template_id,
        category,
        structured_content,
        raw_content,
        note_date,
        patient_id,
        provider_id,
        clinic_id,
        created_at,
        updated_at,
        patients!inner(first_name, last_name),
        provider:users!provider_id(full_name)
      `)
      .single();

    if (createError) {
      console.error('❌ Failed to create clinical note:', createError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create clinical note',
          details: createError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Clinical note created successfully:', clinicalNote.id);

    // Process provider note content for automatic timeline events
    if (clinicalNote.note_type === 'provider_note') {
      console.log('📝 Processing provider note for timeline events...');
      try {
        await processProviderNoteForTimeline(supabaseClient, {
          note_type: clinicalNote.note_type,
          content: content,
          patient_id: clinicalNote.patient_id,
          provider_id: clinicalNote.provider_id
        }, userProfile);
      } catch (timelineError) {
        console.warn('⚠️ Timeline event processing failed for provider note:', timelineError);
        // Don't fail the primary operation
      }
    }

    // Transform the data to include patient and provider names
    const transformedNote = {
      ...clinicalNote,
      patient_name: `${clinicalNote.patients.first_name} ${clinicalNote.patients.last_name}`,
      provider_name: clinicalNote.provider?.full_name || 'Unknown Provider'
    };

    console.log('📤 Sending success response');
    return new Response(
      JSON.stringify(transformedNote),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in create_clinical_notes:', error);
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
