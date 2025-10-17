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

    const url = new URL(req.url);
    const card_code = url.searchParams.get('card_code');

    if (!card_code) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: card_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: giftCard, error } = await supabase
      .from('aesthetic_gift_cards')
      .select('*')
      .eq('card_code', card_code)
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!giftCard) {
      return new Response(
        JSON.stringify({ error: 'Gift card not found', valid: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let isExpired = false;
    if (giftCard.expiration_date) {
      const expirationDate = new Date(giftCard.expiration_date);
      const today = new Date();
      isExpired = expirationDate < today;
    }

    return new Response(JSON.stringify({
      valid: giftCard.is_active && !isExpired && giftCard.current_balance > 0,
      card_code: giftCard.card_code,
      current_balance: giftCard.current_balance,
      original_amount: giftCard.original_amount,
      is_active: giftCard.is_active,
      is_expired: isExpired,
      expiration_date: giftCard.expiration_date,
      last_used_date: giftCard.last_used_date,
      recipient_name: giftCard.recipient_name,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
