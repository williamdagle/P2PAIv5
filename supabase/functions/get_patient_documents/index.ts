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

    const url = new URL(req.url);
    const patientId = url.searchParams.get('patient_id');
    const documentId = url.searchParams.get('id');

    let query = supabase
      .from('patient_documents')
      .select(`
        *,
        patient:patients(id, first_name, last_name),
        uploaded_by_user:users!uploaded_by(id, full_name),
        metadata:document_metadata(*)
      `);

    if (documentId) {
      query = query.eq('id', documentId).single();
    } else if (patientId) {
      query = query.eq('patient_id', patientId).order('upload_date', { ascending: false });
    } else {
      query = query.order('upload_date', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
