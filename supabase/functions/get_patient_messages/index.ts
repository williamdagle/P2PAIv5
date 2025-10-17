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
    const messageId = url.searchParams.get('id');
    const senderId = url.searchParams.get('sender_id');
    const recipientId = url.searchParams.get('recipient_id');

    let query = supabase
      .from('patient_messages')
      .select(`
        *,
        patient:patients(id, first_name, last_name),
        parent_message:patient_messages(id, subject)
      `);

    if (messageId) {
      query = query.eq('id', messageId).single();
    } else {
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }
      if (senderId) {
        query = query.eq('sender_id', senderId);
      }
      if (recipientId) {
        query = query.eq('recipient_id', recipientId);
      }
      query = query.order('created_at', { ascending: false });
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
