import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const patientId = url.searchParams.get('patient_id');
    const treatmentId = url.searchParams.get('treatment_id');
    const treatmentType = url.searchParams.get('treatment_type');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const isCompleted = url.searchParams.get('is_completed');
    const limit = url.searchParams.get('limit');

    let query = supabase
      .from('aesthetic_treatments')
      .select(`
        *,
        patient:patients(id, first_name, last_name),
        provider:users!aesthetic_treatments_provider_id_fkey(id, full_name)
      `)
      .order('treatment_date', { ascending: false });

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (treatmentId) {
      query = query.eq('id', treatmentId);
    }

    if (treatmentType) {
      query = query.eq('treatment_type', treatmentType);
    }

    if (startDate) {
      query = query.gte('treatment_date', startDate);
    }

    if (endDate) {
      query = query.lte('treatment_date', endDate);
    }

    if (isCompleted !== null && isCompleted !== undefined) {
      query = query.eq('is_completed', isCompleted === 'true');
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching treatments:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});