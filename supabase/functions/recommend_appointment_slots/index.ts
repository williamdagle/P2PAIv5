import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SlotRecommendation {
  startTime: string;
  endTime: string;
  confidenceScore: number;
  reasons: string[];
  date: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('[RECOMMEND] Starting request...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[RECOMMEND] Missing authorization header');
      throw new Error('Missing authorization header');
    }

    console.log('[RECOMMEND] Verifying user...');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[RECOMMEND] User verification failed:', userError);
      throw new Error('Invalid authentication token');
    }

    console.log('[RECOMMEND] User verified:', user.id);

    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userData) {
      console.error('[RECOMMEND] User profile error:', profileError);
      throw new Error('User profile not found');
    }

    console.log('[RECOMMEND] User clinic_id:', userData.clinic_id);

    const url = new URL(req.url);
    const providerId = url.searchParams.get('provider_id');
    const appointmentTypeId = url.searchParams.get('appointment_type_id');
    const patientId = url.searchParams.get('patient_id');
    const startDateStr = url.searchParams.get('start_date');
    const endDateStr = url.searchParams.get('end_date');
    const topN = parseInt(url.searchParams.get('top_n') || '5');

    console.log('[RECOMMEND] Parameters:', {
      providerId,
      appointmentTypeId,
      patientId,
      startDateStr,
      endDateStr,
      topN
    });

    if (!providerId || !startDateStr || !endDateStr) {
      console.error('[RECOMMEND] Missing required parameters');
      throw new Error('Missing required parameters');
    }

    // Get appointment type info
    console.log('[RECOMMEND] Fetching appointment type info...');
    let appointmentType = null;
    if (appointmentTypeId) {
      const { data: typeData } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('id', appointmentTypeId)
        .single();
      appointmentType = typeData;
      console.log('[RECOMMEND] Appointment type:', appointmentType?.name || 'Not found');
    }

    const durationMinutes = appointmentType?.default_duration_minutes || 30;
    console.log('[RECOMMEND] Duration:', durationMinutes, 'minutes');

    // Get provider preferences for this appointment type
    console.log('[RECOMMEND] Fetching provider preferences...');
    let providerPreference = null;
    if (appointmentTypeId) {
      const { data: prefData } = await supabase
        .from('provider_appointment_preferences')
        .select('*')
        .eq('provider_id', providerId)
        .eq('appointment_type_id', appointmentTypeId)
        .eq('is_active', true)
        .single();
      providerPreference = prefData;
      console.log('[RECOMMEND] Provider has preferences:', !!providerPreference);
    }

    // Get patient preferences
    console.log('[RECOMMEND] Fetching patient preferences...');
    let patientPreference = null;
    if (patientId) {
      const { data: patPrefData } = await supabase
        .from('patient_scheduling_preferences')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      patientPreference = patPrefData;
      console.log('[RECOMMEND] Patient has preferences:', !!patientPreference);
    }

    // Get available blocks from availability function
    const availabilityUrl = `${supabaseUrl}/functions/v1/get_provider_availability?provider_id=${providerId}&start_date=${startDateStr}&end_date=${endDateStr}&duration_minutes=${durationMinutes}${appointmentTypeId ? `&appointment_type_id=${appointmentTypeId}` : ''}`;
    
    console.log('[RECOMMEND] Calling availability function:', availabilityUrl);
    const availResponse = await fetch(availabilityUrl, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    console.log('[RECOMMEND] Availability response status:', availResponse.status);

    if (!availResponse.ok) {
      const errorText = await availResponse.text();
      console.error('[RECOMMEND] Availability call failed with status:', availResponse.status);
      console.error('[RECOMMEND] Availability error response:', errorText);
      throw new Error(`Failed to fetch availability: ${errorText}`);
    }

    const availabilityData = await availResponse.json();
    console.log('[RECOMMEND] Availability data received:', {
      totalBlocks: availabilityData.availableBlocks?.length || 0,
      buffers: availabilityData.buffers
    });
    
    const availableBlocks = availabilityData.availableBlocks || [];

    if (availableBlocks.length === 0) {
      console.log('[RECOMMEND] No available blocks found, returning empty recommendations');
      return new Response(
        JSON.stringify({
          providerId,
          appointmentTypeId,
          patientId,
          dateRange: { start: startDateStr, end: endDateStr },
          totalSlotsAvailable: 0,
          recommendations: [],
          metadata: {
            appointmentType: appointmentType?.name || 'General',
            durationMinutes,
            providerHasPreferences: !!providerPreference,
            patientHasPreferences: !!patientPreference
          }
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Score each available block
    console.log('[RECOMMEND] Scoring', availableBlocks.length, 'available blocks...');
    const scoredSlots = availableBlocks.map((block: any) => {
      const startTime = new Date(block.startTime);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      const hour = startTime.getHours();
      const dayOfWeek = startTime.getDay();
      const daysFromNow = Math.floor((startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      let score = 100;
      const reasons: string[] = [];

      // Time of day preference matching
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

      // Provider preference for time of day
      if (providerPreference?.preferred_time_of_day) {
        if (providerPreference.preferred_time_of_day === timeOfDay) {
          const strength = providerPreference.preference_strength || 5;
          score += strength * 5;
          reasons.push(`Provider prefers ${timeOfDay} appointments`);
        } else if (providerPreference.preferred_time_of_day !== 'any') {
          score -= 10;
        }
      }

      // Provider preference for specific time range
      if (providerPreference?.preferred_start_time && providerPreference?.preferred_end_time) {
        const prefStart = parseTimeString(providerPreference.preferred_start_time);
        const prefEnd = parseTimeString(providerPreference.preferred_end_time);
        if (hour >= prefStart && hour < prefEnd) {
          score += 15;
          reasons.push('Within provider\'s preferred time window');
        }
      }

      // Provider avoids certain days
      if (providerPreference?.avoid_days?.includes(dayOfWeek)) {
        score -= 20;
        reasons.push('Provider typically avoids this day for this type');
      }

      // Appointment type preference
      if (appointmentType?.preferred_time_of_day === timeOfDay) {
        score += 10;
        reasons.push(`${appointmentType.name} recommended for ${timeOfDay}`);
      }

      // Appointment type specific time range
      if (appointmentType?.preferred_start_time && appointmentType?.preferred_end_time) {
        const typeStart = parseTimeString(appointmentType.preferred_start_time);
        const typeEnd = parseTimeString(appointmentType.preferred_end_time);
        if (hour >= typeStart && hour < typeEnd) {
          score += 10;
          reasons.push('Within recommended time for this appointment type');
        }
      }

      // Patient preference for time of day
      if (patientPreference?.preferred_time_of_day === timeOfDay) {
        score += 15;
        reasons.push('Matches patient\'s preferred time');
      }

      // Patient preference for specific days
      if (patientPreference?.preferred_days?.includes(dayOfWeek)) {
        score += 10;
        reasons.push('Patient\'s preferred day of week');
      }

      // Patient avoids certain days
      if (patientPreference?.avoid_days?.includes(dayOfWeek)) {
        score -= 30;
        reasons.push('Patient prefers to avoid this day');
      }

      // Proximity scoring (sooner is better, but not too soon)
      if (daysFromNow <= 0) {
        score -= 50; // Same day is usually too rushed
        reasons.push('Same day - may be too soon');
      } else if (daysFromNow === 1) {
        score += 5;
        reasons.push('Next day availability');
      } else if (daysFromNow <= 3) {
        score += 20;
        reasons.push('Very soon availability');
      } else if (daysFromNow <= 7) {
        score += 15;
        reasons.push('Available within a week');
      } else if (daysFromNow <= 14) {
        score += 10;
        reasons.push('Available within two weeks');
      } else if (daysFromNow <= 30) {
        score += 5;
      } else {
        score -= 5; // Too far out might not be ideal
      }

      // Morning appointments score slightly higher (general preference)
      if (hour >= 8 && hour < 10) {
        score += 5;
        reasons.push('Early morning slot');
      }

      // Avoid very early or very late
      if (hour < 8 || hour >= 18) {
        score -= 10;
      }

      // Weekend penalty (assuming most prefer weekdays)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        score -= 5;
      }

      return {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        confidenceScore: Math.max(0, Math.min(100, score)),
        reasons: reasons.length > 0 ? reasons : ['Available time slot'],
        date: startTime.toISOString().split('T')[0],
        dayOfWeek,
        timeOfDay
      };
    });

    // Sort by score and take top N
    scoredSlots.sort((a, b) => b.confidenceScore - a.confidenceScore);
    const topSlots = scoredSlots.slice(0, topN);

    console.log('[RECOMMEND] Returning', topSlots.length, 'recommendations');

    return new Response(
      JSON.stringify({
        providerId,
        appointmentTypeId,
        patientId,
        dateRange: { start: startDateStr, end: endDateStr },
        totalSlotsAvailable: availableBlocks.length,
        recommendations: topSlots,
        metadata: {
          appointmentType: appointmentType?.name || 'General',
          durationMinutes,
          providerHasPreferences: !!providerPreference,
          patientHasPreferences: !!patientPreference
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('[RECOMMEND] ERROR:', err);
    console.error('[RECOMMEND] Error message:', err.message);
    console.error('[RECOMMEND] Error stack:', err.stack);
    return new Response(
      JSON.stringify({ error: err.message, details: err.toString() }),
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

function parseTimeString(timeStr: string): number {
  const parts = timeStr.split(':');
  return parseInt(parts[0]);
}
