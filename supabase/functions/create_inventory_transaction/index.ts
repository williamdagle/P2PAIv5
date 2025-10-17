import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const VALID_TRANSACTION_TYPES = [
  'purchase',
  'usage',
  'adjustment',
  'waste',
  'transfer',
  'return'
];

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
      inventory_id,
      transaction_type,
      quantity,
      lot_number,
      expiration_date,
      unit_cost,
      total_cost,
      related_treatment_id,
      related_transaction_id,
      reason,
      notes,
      performed_by,
    } = body;

    if (!clinic_id || !inventory_id || !transaction_type || quantity === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clinic_id, inventory_id, transaction_type, quantity' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!VALID_TRANSACTION_TYPES.includes(transaction_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid transaction_type. Must be one of: ${VALID_TRANSACTION_TYPES.join(', ')}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (quantity === 0) {
      return new Response(
        JSON.stringify({ error: 'Quantity cannot be zero' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: inventoryItem, error: inventoryError } = await supabase
      .from('aesthetic_inventory')
      .select('*')
      .eq('id', inventory_id)
      .single();

    if (inventoryError || !inventoryItem) {
      return new Response(
        JSON.stringify({ error: 'Inventory item not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data, error } = await supabase
      .from('aesthetic_inventory_transactions')
      .insert({
        clinic_id,
        inventory_id,
        transaction_type,
        quantity,
        lot_number: lot_number || null,
        expiration_date: expiration_date || null,
        unit_cost: unit_cost || null,
        total_cost: total_cost || null,
        related_treatment_id: related_treatment_id || null,
        related_transaction_id: related_transaction_id || null,
        reason: reason || null,
        notes: notes || null,
        performed_by: performed_by || user.id,
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory transaction:', error);
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
