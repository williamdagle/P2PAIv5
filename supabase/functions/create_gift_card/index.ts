import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = 4;
  const segmentLength = 4;
  const code = [];

  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code.push(segment);
  }

  return code.join('-');
}

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
      card_type,
      original_amount,
      purchaser_name,
      purchaser_email,
      recipient_name,
      recipient_email,
      patient_id,
      expiration_date,
      message,
      purchase_transaction_id,
    } = body;

    if (!clinic_id || !original_amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clinic_id and original_amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let cardCode = generateGiftCardCode();
    let attempts = 0;
    let isUnique = false;

    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('aesthetic_gift_cards')
        .select('id')
        .eq('card_code', cardCode)
        .maybeSingle();

      if (!existing) {
        isUnique = true;
      } else {
        cardCode = generateGiftCardCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique card code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('aesthetic_gift_cards')
      .insert({
        clinic_id,
        card_code: cardCode,
        card_type: card_type || 'digital',
        original_amount,
        current_balance: original_amount,
        purchaser_name,
        purchaser_email,
        recipient_name,
        recipient_email,
        patient_id,
        expiration_date,
        is_active: true,
        activation_date: new Date().toISOString().split('T')[0],
        purchase_transaction_id,
        message,
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
    return new Response(JSON.stringify({ error: 'Internal server error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
