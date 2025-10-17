import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const VALID_CATEGORIES = [
  'injectable',
  'filler',
  'toxin',
  'skincare',
  'device_consumable',
  'retail',
  'other'
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
    const { id, ...updateFields } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (updateFields.product_category && !VALID_CATEGORIES.includes(updateFields.product_category)) {
      return new Response(
        JSON.stringify({ error: `Invalid product_category. Must be one of: ${VALID_CATEGORIES.join(', ')}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (updateFields.current_stock !== undefined && updateFields.current_stock < 0) {
      return new Response(
        JSON.stringify({ error: 'current_stock cannot be negative' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: existingItem, error: fetchError } = await supabase
      .from('aesthetic_inventory')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingItem) {
      return new Response(
        JSON.stringify({ error: 'Inventory item not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const oldStock = existingItem.current_stock;
    const newStock = updateFields.current_stock;
    const stockChanged = newStock !== undefined && newStock !== oldStock;

    const fieldsToUpdate = {
      ...updateFields,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('aesthetic_inventory')
      .update(fieldsToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating inventory item:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (stockChanged) {
      const quantityDelta = newStock - oldStock;
      const transactionType = quantityDelta > 0 ? 'purchase' : 'adjustment';

      const { error: transError } = await supabase
        .from('aesthetic_inventory_transactions')
        .insert({
          clinic_id: existingItem.clinic_id,
          inventory_id: id,
          transaction_type: transactionType,
          quantity: quantityDelta,
          reason: updateFields.adjustment_reason || 'Stock level updated',
          notes: 'Automatic transaction created from inventory update',
          performed_by: user.id,
          transaction_date: new Date().toISOString(),
        });

      if (transError) {
        console.error('Error creating transaction log:', transError);
      }
    }

    return new Response(JSON.stringify(data), {
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
