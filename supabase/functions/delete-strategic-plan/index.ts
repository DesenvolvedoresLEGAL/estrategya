import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Parse user from verified JWT (function has verify_jwt = true)
    const token = authHeader.replace('Bearer ', '');
    const parseJwt = (t: string) => {
      const base64 = t.split('.')[1];
      const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    };

    let userId: string | null = null;
    try {
      const payload = parseJwt(token);
      userId = payload?.sub ?? null;
    } catch (e) {
      console.error('JWT parse error:', e);
      return new Response(
        JSON.stringify({ error: 'Token de autenticação inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${userId}`);

    const { companyId } = await req.json();

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'ID da empresa é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Delete plan request for company ${companyId} by user ${userId}`);

    // Verify user is owner or admin of the company
    const { data: membership, error: membershipError } = await supabaseClient
      .from('team_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      console.error('Membership check error:', membershipError);
      return new Response(
        JSON.stringify({ error: 'Você não tem permissão para deletar o plano desta empresa' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Apenas proprietários e administradores podem deletar o plano' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log action before deletion (will be deleted but kept for audit trail if needed)
    await supabaseClient.from('activity_log').insert({
      company_id: companyId,
      user_id: userId,
      action_type: 'delete_plan',
      entity_type: 'strategic_plan',
      entity_id: companyId,
      details: { deleted_at: new Date().toISOString() }
    });

    console.log('Starting deletion process...');

    // Delete in correct order respecting foreign keys
    // Step 1: Delete comments, ai_insights, activity_log
    await supabaseClient.from('comments').delete().eq('entity_id', companyId);
    await supabaseClient.from('ai_insights').delete().eq('company_id', companyId);
    await supabaseClient.from('activity_log').delete().eq('company_id', companyId);
    console.log('Step 1 complete: comments, insights, activity_log deleted');

    // Step 2: Get all objectives for this company
    const { data: objectives } = await supabaseClient
      .from('strategic_objectives')
      .select('id')
      .eq('company_id', companyId);

    const objectiveIds = objectives?.map(o => o.id) || [];

    if (objectiveIds.length > 0) {
      // Delete metric_updates
      const { data: metrics } = await supabaseClient
        .from('metrics')
        .select('id')
        .in('objective_id', objectiveIds);
      
      const metricIds = metrics?.map(m => m.id) || [];
      
      if (metricIds.length > 0) {
        await supabaseClient.from('metric_updates').delete().in('metric_id', metricIds);
      }

      // Delete objective_updates
      await supabaseClient.from('objective_updates').delete().in('objective_id', objectiveIds);
      console.log('Step 2 complete: metric_updates, objective_updates deleted');

      // Step 3: Delete metrics and initiatives
      await supabaseClient.from('metrics').delete().in('objective_id', objectiveIds);
      await supabaseClient.from('initiatives').delete().in('objective_id', objectiveIds);
      console.log('Step 3 complete: metrics, initiatives deleted');

      // Step 4: Delete strategic objectives
      await supabaseClient.from('strategic_objectives').delete().eq('company_id', companyId);
      console.log('Step 4 complete: strategic_objectives deleted');
    }

    // Step 5: Delete OGSM structure
    const { data: ogsmData } = await supabaseClient
      .from('ogsm')
      .select('id')
      .eq('company_id', companyId);

    const ogsmIds = ogsmData?.map(o => o.id) || [];

    if (ogsmIds.length > 0) {
      // Get strategies
      const { data: strategies } = await supabaseClient
        .from('ogsm_strategies')
        .select('id')
        .in('ogsm_id', ogsmIds);

      const strategyIds = strategies?.map(s => s.id) || [];

      if (strategyIds.length > 0) {
        await supabaseClient.from('ogsm_measures').delete().in('strategy_id', strategyIds);
      }

      await supabaseClient.from('ogsm_strategies').delete().in('ogsm_id', ogsmIds);
      await supabaseClient.from('ogsm_goals').delete().in('ogsm_id', ogsmIds);
      await supabaseClient.from('ogsm').delete().eq('company_id', companyId);
      console.log('Step 5 complete: OGSM structure deleted');
    }

    // Step 6: Delete other strategic data
    await supabaseClient.from('execution_plan').delete().eq('company_id', companyId);
    await supabaseClient.from('execution_reminders').delete().eq('company_id', companyId);
    await supabaseClient.from('strategic_context').delete().eq('company_id', companyId);
    await supabaseClient.from('pestel_analysis').delete().eq('company_id', companyId);
    await supabaseClient.from('porter_analysis').delete().eq('company_id', companyId);
    await supabaseClient.from('maturity_assessment').delete().eq('company_id', companyId);
    await supabaseClient.from('financial_data').delete().eq('company_id', companyId);
    console.log('Step 6 complete: execution_plan, context, analyses deleted');

    // Step 7: Delete wizard progress
    const { error: wizardError } = await supabaseClient
      .from('wizard_progress')
      .delete()
      .eq('company_id', companyId);

    if (wizardError) {
      console.error('Error deleting wizard_progress:', wizardError);
    } else {
      console.log('Step 7 complete: wizard_progress deleted');
    }

    console.log('Deletion process complete!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Plano estratégico deletado com sucesso',
        deletedItems: {
          objectives: objectiveIds.length,
          ogsm: ogsmIds.length
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error deleting strategic plan:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Erro ao deletar plano estratégico' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
