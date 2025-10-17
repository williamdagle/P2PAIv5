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

    const body = await req.json();
    const {
      clinic_id,
      patient_id,
      provider_id,
      treatment_date,
      treatment_type,
      treatment_name,
      areas_treated,
      products_used,
      units_used,
      volume_ml,
      batch_numbers,
      technique_notes,
      patient_tolerance,
      immediate_response,
      adverse_events,
      follow_up_date,
      treatment_outcome,
      outcome_rating,
      clinical_notes,
      is_completed,
    } = body;

    if (!clinic_id || !patient_id || !provider_id || !treatment_type || !treatment_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clinic_id, patient_id, provider_id, treatment_type, treatment_name' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data, error } = await supabase
      .from('aesthetic_treatments')
      .insert({
        clinic_id,
        patient_id,
        provider_id,
        treatment_date: treatment_date || new Date().toISOString().split('T')[0],
        treatment_type,
        treatment_name,
        areas_treated: areas_treated || [],
        products_used: products_used || [],
        units_used,
        volume_ml,
        batch_numbers: batch_numbers || [],
        technique_notes,
        patient_tolerance,
        immediate_response,
        adverse_events,
        follow_up_date,
        treatment_outcome,
        outcome_rating,
        clinical_notes,
        is_completed: is_completed || false,
        completed_at: is_completed ? new Date().toISOString() : null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating treatment:', error);
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
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});