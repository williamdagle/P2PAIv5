import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userData) {
      throw new Error('User profile not found');
    }

    const url = new URL(req.url);
    const appointmentTypeId = url.searchParams.get('appointment_type_id');

    if (!appointmentTypeId) {
      throw new Error('Missing appointment_type_id parameter');
    }

    // Get appointment type
    const { data: appointmentType, error: typeError } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('id', appointmentTypeId)
      .single();

    if (typeError) throw typeError;
    if (!appointmentType) throw new Error('Appointment type not found');

    // Get buffer requirements
    const { data: bufferData } = await supabase
      .rpc('get_appointment_buffer', {
        p_clinic_id: userData.clinic_id,
        p_provider_id: null,
        p_appointment_type_id: appointmentTypeId
      });

    const buffer = bufferData?.[0] || {
      pre_minutes: 0,
      post_minutes: 0,
      applies_to_back_to_back: true
    };

    // Get clinic default buffer if no type-specific buffer
    let clinicBuffer = null;
    if (!bufferData || bufferData.length === 0) {
      const { data: clinicBufferData } = await supabase
        .from('appointment_buffers')
        .select('*')
        .eq('clinic_id', userData.clinic_id)
        .eq('buffer_level', 'clinic_default')
        .eq('is_active', true)
        .single();
      
      clinicBuffer = clinicBufferData;
    }

    // Build response
    const metadata = {
      id: appointmentType.id,
      name: appointmentType.name,
      description: appointmentType.description,
      durationMinutes: appointmentType.default_duration_minutes,
      requiredProviderRole: appointmentType.required_provider_role,
      requiredProviderSpecialty: appointmentType.required_provider_specialty,
      preferredTimeOfDay: appointmentType.preferred_time_of_day,
      preferredStartTime: appointmentType.preferred_start_time,
      preferredEndTime: appointmentType.preferred_end_time,
      canBeAutoScheduled: appointmentType.can_be_auto_scheduled !== false,
      requiresApproval: appointmentType.requires_approval || false,
      buffer: {
        preAppointmentMinutes: bufferData?.[0]?.pre_minutes || clinicBuffer?.pre_appointment_buffer_minutes || 0,
        postAppointmentMinutes: bufferData?.[0]?.post_minutes || clinicBuffer?.post_appointment_buffer_minutes || 0,
        appliesToBackToBack: bufferData?.[0]?.applies_to_back_to_back ?? clinicBuffer?.applies_to_back_to_back ?? true,
        source: bufferData && bufferData.length > 0 ? 'appointment_type_specific' : (clinicBuffer ? 'clinic_default' : 'none')
      },
      colorCode: appointmentType.color_code || '#3B82F6'
    };

    return new Response(
      JSON.stringify(metadata),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('Error in get_appointment_type_metadata:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
