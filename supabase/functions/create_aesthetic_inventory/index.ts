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
    const {
      clinic_id,
      product_category,
      product_name,
      product_brand,
      sku,
      description,
      unit_size,
      current_stock,
      reorder_point,
      unit_cost,
      retail_price,
      requires_lot_tracking,
      requires_expiration_tracking,
      is_active,
      supplier_name,
      supplier_contact,
      notes,
    } = body;

    if (!clinic_id || !product_category || !product_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clinic_id, product_category, product_name' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!VALID_CATEGORIES.includes(product_category)) {
      return new Response(
        JSON.stringify({ error: `Invalid product_category. Must be one of: ${VALID_CATEGORIES.join(', ')}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (current_stock !== undefined && current_stock < 0) {
      return new Response(
        JSON.stringify({ error: 'current_stock cannot be negative' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data, error } = await supabase
      .from('aesthetic_inventory')
      .insert({
        clinic_id,
        product_category,
        product_name,
        product_brand: product_brand || null,
        sku: sku || null,
        description: description || null,
        unit_size: unit_size || null,
        current_stock: current_stock || 0,
        reorder_point: reorder_point || 5,
        unit_cost: unit_cost || null,
        retail_price: retail_price || null,
        requires_lot_tracking: requires_lot_tracking || false,
        requires_expiration_tracking: requires_expiration_tracking || false,
        is_active: is_active !== undefined ? is_active : true,
        supplier_name: supplier_name || null,
        supplier_contact: supplier_contact || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory item:', error);
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
