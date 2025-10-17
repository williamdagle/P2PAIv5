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
      membership_tier,
      membership_name,
      monthly_fee,
      billing_cycle,
      start_date,
      end_date,
      auto_renew,
      discount_percentage,
      benefits,
      credits_balance,
      stripe_subscription_id,
    } = body;

    if (!clinic_id || !patient_id || !membership_tier || !membership_name || !monthly_fee) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingMembership } = await supabase
      .from('aesthetic_memberships')
      .select('id')
      .eq('patient_id', patient_id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingMembership) {
      return new Response(
        JSON.stringify({ error: 'Patient already has an active membership' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('aesthetic_memberships')
      .insert({
        clinic_id,
        patient_id,
        membership_tier,
        membership_name,
        monthly_fee,
        billing_cycle: billing_cycle || 'monthly',
        start_date: start_date || new Date().toISOString().split('T')[0],
        end_date,
        auto_renew: auto_renew !== undefined ? auto_renew : true,
        discount_percentage: discount_percentage || 0,
        benefits: benefits || {},
        credits_balance: credits_balance || 0,
        stripe_subscription_id,
        status: 'active',
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
