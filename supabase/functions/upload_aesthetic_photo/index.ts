import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      clinic_id,
      patient_id,
      treatment_id,
      photo_type,
      photo_url,
      thumbnail_url,
      view_angle,
      body_area,
      facial_grid_data,
      annotations,
      lighting_notes,
      camera_settings,
      consent_obtained,
      metadata,
    } = body;

    if (!clinic_id || !patient_id || !photo_type || !photo_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clinic_id, patient_id, photo_type, photo_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('aesthetic_photos')
      .insert({
        clinic_id,
        patient_id,
        treatment_id,
        photo_type,
        photo_url,
        thumbnail_url,
        view_angle,
        body_area,
        facial_grid_data,
        annotations: annotations || [],
        lighting_notes,
        camera_settings,
        consent_obtained: consent_obtained || false,
        consent_date: consent_obtained ? new Date().toISOString() : null,
        uploaded_by: user.id,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});