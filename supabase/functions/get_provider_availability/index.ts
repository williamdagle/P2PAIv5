import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AvailabilityBlock {
  startTime: string;
  endTime: string;
  dayOfWeek: number;
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
    console.log('[AVAILABILITY] Starting request...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[AVAILABILITY] Missing authorization header');
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[AVAILABILITY] Verifying user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[AVAILABILITY] User verification failed:', userError);
      throw new Error('Invalid authentication token');
    }

    console.log('[AVAILABILITY] User verified:', user.id);

    console.log('[AVAILABILITY] Fetching user profile...');
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userData) {
      console.error('[AVAILABILITY] User profile error:', profileError);
      throw new Error('User profile not found');
    }

    console.log('[AVAILABILITY] User clinic_id:', userData.clinic_id);

    const url = new URL(req.url);
    const providerId = url.searchParams.get('provider_id');
    const startDateStr = url.searchParams.get('start_date');
    const endDateStr = url.searchParams.get('end_date');
    const durationMinutes = parseInt(url.searchParams.get('duration_minutes') || '30');
    const appointmentTypeId = url.searchParams.get('appointment_type_id');

    console.log('[AVAILABILITY] Parameters:', {
      providerId,
      startDateStr,
      endDateStr,
      durationMinutes,
      appointmentTypeId
    });

    if (!providerId || !startDateStr || !endDateStr) {
      console.error('[AVAILABILITY] Missing required parameters');
      throw new Error('Missing required parameters: provider_id, start_date, end_date');
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Get buffer configuration
    console.log('[AVAILABILITY] Fetching buffer configuration...');
    const { data: bufferData, error: bufferError } = await supabase
      .rpc('get_appointment_buffer', {
        p_clinic_id: userData.clinic_id,
        p_provider_id: providerId,
        p_appointment_type_id: appointmentTypeId
      });

    if (bufferError) {
      console.error('[AVAILABILITY] Buffer RPC error:', bufferError);
    }
    console.log('[AVAILABILITY] Buffer data:', bufferData);

    const preBuffer = bufferData?.[0]?.pre_minutes || 0;
    const postBuffer = bufferData?.[0]?.post_minutes || 0;
    console.log('[AVAILABILITY] Buffers - pre:', preBuffer, 'post:', postBuffer);

    // Get provider's schedule
    console.log('[AVAILABILITY] Fetching provider schedules...');
    const { data: schedules, error: schedError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_available', true);

    if (schedError) {
      console.error('[AVAILABILITY] Schedule error:', schedError);
      throw schedError;
    }
    console.log('[AVAILABILITY] Found schedules:', schedules?.length || 0);

    // Get schedule exceptions
    console.log('[AVAILABILITY] Fetching schedule exceptions...');
    const { data: exceptions, error: exceptError } = await supabase
      .from('provider_schedule_exceptions')
      .select('*')
      .eq('provider_id', providerId)
      .gte('exception_date', startDateStr)
      .lte('exception_date', endDateStr);

    if (exceptError) {
      console.error('[AVAILABILITY] Exception error:', exceptError);
      throw exceptError;
    }
    console.log('[AVAILABILITY] Found exceptions:', exceptions?.length || 0);

    // Get existing appointments
    console.log('[AVAILABILITY] Fetching existing appointments...');
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('appointment_date, duration_minutes')
      .eq('provider_id', providerId)
      .gte('appointment_date', startDate.toISOString())
      .lte('appointment_date', endDate.toISOString())
      .eq('is_deleted', false)
      .neq('status', 'cancelled');

    if (apptError) {
      console.error('[AVAILABILITY] Appointments error:', apptError);
      throw apptError;
    }
    console.log('[AVAILABILITY] Found appointments:', appointments?.length || 0);

    // Get breaks and blocked time
    console.log('[AVAILABILITY] Fetching breaks and blocked time...');
    const { data: breaks, error: breaksError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_available', false);

    if (breaksError) {
      console.error('[AVAILABILITY] Breaks error:', breaksError);
      throw breaksError;
    }
    console.log('[AVAILABILITY] Found breaks:', breaks?.length || 0);

    const availableBlocks: AvailabilityBlock[] = [];

    // Iterate through each day in the range
    console.log('[AVAILABILITY] Processing date range...');
    let daysProcessed = 0;
    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      daysProcessed++;

      // Check for exceptions on this date
      const exception = exceptions?.find(e => e.exception_date === dateStr);
      if (exception && !exception.is_available) {
        console.log(`[AVAILABILITY] Skipping ${dateStr} due to exception`);
        continue; // Skip this day entirely
      }

      // Get schedule for this day of week
      let daySchedules = schedules?.filter(s => s.day_of_week === dayOfWeek) || [];
      console.log(`[AVAILABILITY] ${dateStr} (day ${dayOfWeek}): ${daySchedules.length} schedule blocks`);

      // If there's a special hours exception, use that instead
      if (exception && exception.is_available) {
        daySchedules = [{
          start_time: exception.start_time,
          end_time: exception.end_time,
          day_of_week: dayOfWeek
        }];
      }

      // Process each schedule block for this day
      for (const schedule of daySchedules) {
        const scheduleStart = new Date(`${dateStr}T${schedule.start_time}`);
        const scheduleEnd = new Date(`${dateStr}T${schedule.end_time}`);

        // Get breaks for this day
        const dayBreaks = breaks?.filter(b => b.day_of_week === dayOfWeek) || [];

        // Get appointments for this day
        const dayAppointments = appointments?.filter(a => {
          const apptDate = new Date(a.appointment_date);
          return apptDate.toISOString().split('T')[0] === dateStr;
        }) || [];

        // Find available time slots
        const slots = findAvailableSlots(
          scheduleStart,
          scheduleEnd,
          dayBreaks.map(b => ({
            start: new Date(`${dateStr}T${b.start_time}`),
            end: new Date(`${dateStr}T${b.end_time}`)
          })),
          dayAppointments.map(a => ({
            start: new Date(a.appointment_date),
            end: new Date(new Date(a.appointment_date).getTime() + a.duration_minutes * 60000)
          })),
          durationMinutes,
          preBuffer,
          postBuffer
        );

        availableBlocks.push(...slots.map(slot => ({
          startTime: slot.start.toISOString(),
          endTime: slot.end.toISOString(),
          dayOfWeek,
          date: dateStr
        })));
      }
    }

    console.log('[AVAILABILITY] Processed', daysProcessed, 'days');
    console.log('[AVAILABILITY] Found', availableBlocks.length, 'available blocks');

    return new Response(
      JSON.stringify({
        providerId,
        startDate: startDateStr,
        endDate: endDateStr,
        durationMinutes,
        buffers: { pre: preBuffer, post: postBuffer },
        availableBlocks
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('[AVAILABILITY] ERROR:', err);
    console.error('[AVAILABILITY] Error message:', err.message);
    console.error('[AVAILABILITY] Error stack:', err.stack);
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

function findAvailableSlots(
  scheduleStart: Date,
  scheduleEnd: Date,
  breaks: Array<{ start: Date; end: Date }>,
  appointments: Array<{ start: Date; end: Date }>,
  durationMinutes: number,
  preBuffer: number,
  postBuffer: number
): Array<{ start: Date; end: Date }> {
  const slots: Array<{ start: Date; end: Date }> = [];
  
  // Combine breaks and appointments into busy periods
  const busyPeriods = [...breaks];
  
  // Add appointments with buffers
  for (const appt of appointments) {
    const bufferedStart = new Date(appt.start.getTime() - preBuffer * 60000);
    const bufferedEnd = new Date(appt.end.getTime() + postBuffer * 60000);
    busyPeriods.push({ start: bufferedStart, end: bufferedEnd });
  }

  // Sort busy periods by start time
  busyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Merge overlapping busy periods
  const mergedBusy: Array<{ start: Date; end: Date }> = [];
  for (const period of busyPeriods) {
    if (mergedBusy.length === 0) {
      mergedBusy.push(period);
    } else {
      const last = mergedBusy[mergedBusy.length - 1];
      if (period.start <= last.end) {
        last.end = new Date(Math.max(last.end.getTime(), period.end.getTime()));
      } else {
        mergedBusy.push(period);
      }
    }
  }

  // Find free slots between busy periods
  let currentTime = new Date(scheduleStart);
  
  for (const busy of mergedBusy) {
    if (busy.start > currentTime) {
      const freeStart = currentTime;
      const freeEnd = busy.start;
      const freeDuration = (freeEnd.getTime() - freeStart.getTime()) / 60000;
      
      if (freeDuration >= durationMinutes) {
        slots.push({ start: freeStart, end: freeEnd });
      }
    }
    currentTime = new Date(Math.max(currentTime.getTime(), busy.end.getTime()));
  }

  // Check if there's time after the last busy period
  if (currentTime < scheduleEnd) {
    const freeDuration = (scheduleEnd.getTime() - currentTime.getTime()) / 60000;
    if (freeDuration >= durationMinutes) {
      slots.push({ start: currentTime, end: scheduleEnd });
    }
  }

  return slots;
}
