import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Trigger form assignments based on publication rules
 * Called when: patient created, state changed, group assigned, etc.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const {
      patient_id,
      clinic_id,
      trigger_type, // 'new_patient', 'state_change', 'group_assignment', 'appointment_type', 'manual'
      trigger_data = {} // Additional context (state_code, group_id, etc.)
    } = body;

    if (!patient_id || !clinic_id || !trigger_type) {
      return new Response(
        JSON.stringify({ error: 'patient_id, clinic_id, and trigger_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active publication rules for this trigger type
    const { data: rules, error: rulesError } = await supabaseClient
      .from('form_publication_rules')
      .select(`
        *,
        form:form_definitions!inner(id, current_version_id, form_name)
      `)
      .eq('clinic_id', clinic_id)
      .eq('trigger_type', trigger_type)
      .eq('is_active', true)
      .eq('auto_assign', true);

    if (rulesError) {
      return new Response(
        JSON.stringify({ error: rulesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No matching publication rules found', assigned_count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get patient info for context matching
    const { data: patient } = await supabaseClient
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .single();

    if (!patient) {
      return new Response(
        JSON.stringify({ error: 'Patient not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const assignments = [];
    const errors = [];

    for (const rule of rules) {
      try {
        // Evaluate trigger conditions
        const conditions = rule.trigger_conditions as any || {};
        let shouldAssign = true;

        // Check state-specific conditions
        if (conditions.states && trigger_data.state_code) {
          shouldAssign = conditions.states.includes(trigger_data.state_code);
        }

        // Check group-specific conditions
        if (conditions.groups && trigger_data.group_id) {
          shouldAssign = conditions.groups.includes(trigger_data.group_id);
        }

        // Check appointment type conditions
        if (conditions.appointment_types && trigger_data.appointment_type_id) {
          shouldAssign = conditions.appointment_types.includes(trigger_data.appointment_type_id);
        }

        if (!shouldAssign) {
          continue;
        }

        // Check if form already assigned
        const { data: existing } = await supabaseClient
          .from('patient_form_assignments')
          .select('id')
          .eq('patient_id', patient_id)
          .eq('form_definition_id', rule.form_definition_id)
          .in('status', ['assigned', 'in_progress'])
          .limit(1);

        if (existing && existing.length > 0) {
          continue; // Skip if already assigned
        }

        // Calculate due date
        let dueDate = null;
        if (rule.due_days_offset) {
          const date = new Date();
          date.setDate(date.getDate() + rule.due_days_offset);
          dueDate = date.toISOString().split('T')[0];
        }

        // Create assignment
        const assignmentData = {
          clinic_id,
          patient_id,
          form_definition_id: rule.form_definition_id,
          form_version_id: (rule.form as any).current_version_id,
          due_date: dueDate,
          priority: rule.assignment_priority || 'medium',
          status: 'assigned',
          assignment_reason: `Auto-assigned via publication rule: ${rule.rule_name} (trigger: ${trigger_type})`
        };

        const { data: assignment, error: assignmentError } = await supabaseClient
          .from('patient_form_assignments')
          .insert(assignmentData)
          .select()
          .single();

        if (assignmentError) {
          errors.push({
            form_name: (rule.form as any).form_name,
            error: assignmentError.message
          });
        } else {
          assignments.push({
            form_name: (rule.form as any).form_name,
            assignment_id: assignment.id
          });
        }
      } catch (error) {
        errors.push({
          form_name: (rule.form as any).form_name,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        trigger_type,
        rules_evaluated: rules.length,
        assigned_count: assignments.length,
        assignments,
        errors
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
