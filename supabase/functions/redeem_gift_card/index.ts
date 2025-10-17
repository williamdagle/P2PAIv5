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
    const { card_code, redemption_amount, transaction_id } = body;

    if (!card_code || !redemption_amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: card_code and redemption_amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: giftCard, error: fetchError } = await supabase
      .from('aesthetic_gift_cards')
      .select('*')
      .eq('card_code', card_code)
      .maybeSingle();

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!giftCard) {
      return new Response(
        JSON.stringify({ error: 'Gift card not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!giftCard.is_active) {
      return new Response(
        JSON.stringify({ error: 'Gift card is not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (giftCard.expiration_date) {
      const expirationDate = new Date(giftCard.expiration_date);
      const today = new Date();
      if (expirationDate < today) {
        return new Response(
          JSON.stringify({ error: 'Gift card has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (giftCard.current_balance < redemption_amount) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient balance',
          current_balance: giftCard.current_balance,
          requested_amount: redemption_amount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newBalance = giftCard.current_balance - redemption_amount;

    const { data: updatedCard, error: updateError } = await supabase
      .from('aesthetic_gift_cards')
      .update({
        current_balance: newBalance,
        last_used_date: new Date().toISOString().split('T')[0],
        is_active: newBalance > 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', giftCard.id)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      gift_card: updatedCard,
      redeemed_amount: redemption_amount,
      remaining_balance: newBalance,
      transaction_id,
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
