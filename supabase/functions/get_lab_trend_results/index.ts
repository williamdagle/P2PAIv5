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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const url = new URL(req.url);
    const patient_id = url.searchParams.get('patient_id');
    const lab_marker = url.searchParams.get('lab_marker');
    const category = url.searchParams.get('category');
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');

    let query = supabase
      .from('lab_trend_results')
      .select('*')
      .order('result_date', { ascending: false });

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    if (lab_marker) {
      query = query.eq('lab_marker', lab_marker);
    }

    if (start_date) {
      query = query.gte('result_date', start_date);
    }

    if (end_date) {
      query = query.lte('result_date', end_date);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // If category filter is specified, filter by marker names in that category
    let filteredData = data;
    if (category) {
      const { data: markers } = await supabase
        .from('lab_marker_metadata')
        .select('marker_name, category_id, lab_categories(name)')
        .eq('lab_categories.name', category);

      if (markers) {
        const markerNames = markers.map(m => m.marker_name);
        filteredData = data?.filter(result => markerNames.includes(result.lab_marker));
      }
    }

    return new Response(JSON.stringify(filteredData || []), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
