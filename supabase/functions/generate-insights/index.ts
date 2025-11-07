import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Insight {
  company_id: string;
  insight_type: 'risco' | 'oportunidade' | 'benchmark' | 'recomendacao';
  priority: 'baixa' | 'media' | 'alta';
  title: string;
  description: string;
  related_objective_id?: string;
  status: 'novo';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client for background tasks
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { companyId } = await req.json();

    if (!companyId) {
      // If no companyId provided, process all companies (for cronjob)
      const { data: companies, error: companiesError } = await supabaseAdmin
        .from('companies')
        .select('id');

      if (companiesError) throw companiesError;

      for (const company of companies || []) {
        await generateInsightsForCompany(company.id, supabaseAdmin);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        processed: companies?.length || 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Process single company
      await generateInsightsForCompany(companyId, supabaseAdmin);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error generating insights:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateInsightsForCompany(companyId: string, supabase: any) {
  const insights: Insight[] = [];

  // 1. Análise de Objetivos e Progresso
  const { data: objectives } = await supabase
    .from('strategic_objectives')
    .select(`
      *,
      initiatives (
        id,
        title,
        status,
        due_date,
        ice_score
      ),
      metrics (
        id,
        name,
        current_value,
        target
      )
    `)
    .eq('company_id', companyId);

  for (const objective of objectives || []) {
    // Verificar iniciativas atrasadas
    const overdueInitiatives = objective.initiatives?.filter((i: any) => {
      if (!i.due_date) return false;
      const dueDate = new Date(i.due_date);
      const today = new Date();
      return dueDate < today && i.status !== 'concluída';
    }) || [];

    if (overdueInitiatives.length > 0) {
      insights.push({
        company_id: companyId,
        insight_type: 'risco',
        priority: 'alta',
        title: `${overdueInitiatives.length} iniciativa(s) atrasada(s) em "${objective.title}"`,
        description: `As seguintes iniciativas estão atrasadas: ${overdueInitiatives.map((i: any) => i.title).join(', ')}. Recomenda-se revisar prazos ou realocar recursos.`,
        related_objective_id: objective.id,
        status: 'novo',
      });
    }

    // Verificar iniciativas sem progresso há 30 dias
    const stagnantInitiatives = objective.initiatives?.filter((i: any) => 
      i.status === 'não iniciada' || i.status === 'em_planejamento'
    ) || [];

    if (stagnantInitiatives.length >= 3) {
      insights.push({
        company_id: companyId,
        insight_type: 'risco',
        priority: 'media',
        title: `Múltiplas iniciativas não iniciadas em "${objective.title}"`,
        description: `${stagnantInitiatives.length} iniciativas ainda não foram iniciadas. Considere priorizar ou reavaliar a viabilidade destas ações.`,
        related_objective_id: objective.id,
        status: 'novo',
      });
    }

    // Identificar Quick Wins (alto ICE, baixo esforço)
    const quickWins = objective.initiatives?.filter((i: any) => 
      i.ice_score && i.ice_score >= 60 && i.status !== 'concluída'
    ) || [];

    if (quickWins.length > 0) {
      insights.push({
        company_id: companyId,
        insight_type: 'oportunidade',
        priority: 'alta',
        title: `Quick Win identificado em "${objective.title}"`,
        description: `A iniciativa "${quickWins[0].title}" tem alto score ICE (${quickWins[0].ice_score}). Priorize esta ação para resultados rápidos.`,
        related_objective_id: objective.id,
        status: 'novo',
      });
    }

    // Verificar métricas fora da meta
    for (const metric of objective.metrics || []) {
      if (!metric.current_value || !metric.target) continue;
      
      try {
        const current = parseFloat(metric.current_value);
        const target = parseFloat(metric.target);
        
        if (isNaN(current) || isNaN(target)) continue;
        
        const percentageOfTarget = (current / target) * 100;
        
        if (percentageOfTarget < 50) {
          insights.push({
            company_id: companyId,
            insight_type: 'risco',
            priority: 'alta',
            title: `Métrica "${metric.name}" abaixo de 50% da meta`,
            description: `Valor atual: ${metric.current_value}, Meta: ${metric.target}. Recomenda-se ação corretiva imediata.`,
            related_objective_id: objective.id,
            status: 'novo',
          });
        } else if (percentageOfTarget >= 90) {
          insights.push({
            company_id: companyId,
            insight_type: 'oportunidade',
            priority: 'media',
            title: `Métrica "${metric.name}" próxima da meta!`,
            description: `Você está em ${percentageOfTarget.toFixed(0)}% da meta (${metric.current_value}/${metric.target}). Mantenha o ritmo!`,
            related_objective_id: objective.id,
            status: 'novo',
          });
        }
      } catch (e) {
        // Skip metrics that can't be parsed as numbers
        continue;
      }
    }
  }

  // 2. Análise de Execução 4DX
  const { data: executionPlan } = await supabase
    .from('execution_plan')
    .select('*, weekly_checkins (*)')
    .eq('company_id', companyId)
    .single();

  if (executionPlan) {
    const recentCheckins = executionPlan.weekly_checkins?.slice(-4) || [];
    
    if (recentCheckins.length === 0) {
      insights.push({
        company_id: companyId,
        insight_type: 'recomendacao',
        priority: 'alta',
        title: 'Nenhum check-in semanal registrado',
        description: 'Implemente reuniões semanais WBR para acompanhar o progresso do MCI e manter o time engajado.',
        status: 'novo',
      });
    } else if (recentCheckins.length < 3) {
      insights.push({
        company_id: companyId,
        insight_type: 'recomendacao',
        priority: 'media',
        title: 'Check-ins semanais inconsistentes',
        description: 'A cadência de check-ins está irregular. Mantenha reuniões semanais consistentes para melhor execução.',
        status: 'novo',
      });
    }
  }

  // 3. Análise de Balance BSC
  const { data: bscObjectives } = await supabase
    .from('strategic_objectives')
    .select('perspective')
    .eq('company_id', companyId);

  const perspectiveCounts: Record<string, number> = {};
  bscObjectives?.forEach((obj: any) => {
    if (obj.perspective) {
      perspectiveCounts[obj.perspective] = (perspectiveCounts[obj.perspective] || 0) + 1;
    }
  });

  const perspectives = Object.keys(perspectiveCounts);
  if (perspectives.length < 4) {
    insights.push({
      company_id: companyId,
      insight_type: 'recomendacao',
      priority: 'media',
      title: 'Balanced Scorecard desbalanceado',
      description: `Apenas ${perspectives.length} perspectivas do BSC estão sendo utilizadas. Considere adicionar objetivos nas demais perspectivas para uma estratégia mais equilibrada.`,
      status: 'novo',
    });
  }

  // 4. Análise de Priorização ICE
  const { data: allInitiatives } = await supabase
    .from('initiatives')
    .select('*, objective:strategic_objectives!inner(company_id)')
    .eq('objective.company_id', companyId);

  const withIceScore = allInitiatives?.filter((i: any) => i.ice_score) || [];
  const withoutIceScore = allInitiatives?.filter((i: any) => !i.ice_score) || [];

  if (withoutIceScore.length > withIceScore.length) {
    insights.push({
      company_id: companyId,
      insight_type: 'recomendacao',
      priority: 'media',
      title: 'Muitas iniciativas sem score ICE',
      description: `${withoutIceScore.length} iniciativas não têm score ICE definido. Priorize usando o framework ICE (Impacto, Confiança, Esforço).`,
      status: 'novo',
    });
  }

  // 5. Benchmarking Simples (baseado em médias)
  if (allInitiatives && allInitiatives.length > 0) {
    const completedCount = allInitiatives.filter((i: any) => i.status === 'concluída').length;
    const completionRate = (completedCount / allInitiatives.length) * 100;

    if (completionRate < 20) {
      insights.push({
        company_id: companyId,
        insight_type: 'benchmark',
        priority: 'media',
        title: 'Taxa de conclusão abaixo da média',
        description: `Apenas ${completionRate.toFixed(0)}% das iniciativas foram concluídas. A média de mercado é 40-60%. Revise a viabilidade das iniciativas planejadas.`,
        status: 'novo',
      });
    } else if (completionRate >= 60) {
      insights.push({
        company_id: companyId,
        insight_type: 'benchmark',
        priority: 'baixa',
        title: 'Excelente taxa de conclusão!',
        description: `${completionRate.toFixed(0)}% das iniciativas foram concluídas, acima da média de mercado (40-60%). Continue assim!`,
        status: 'novo',
      });
    }
  }

  // Remover insights duplicados das últimas 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentInsights } = await supabase
    .from('ai_insights')
    .select('title')
    .eq('company_id', companyId)
    .gte('created_at', sevenDaysAgo.toISOString());

  const existingTitles = new Set(recentInsights?.map((i: any) => i.title) || []);
  const newInsights = insights.filter((i: Insight) => !existingTitles.has(i.title));

  // Salvar novos insights
  if (newInsights.length > 0) {
    const { error: insertError } = await supabase
      .from('ai_insights')
      .insert(newInsights);

    if (insertError) {
      console.error('Error inserting insights:', insertError);
    } else {
      console.log(`Generated ${newInsights.length} new insights for company ${companyId}`);
    }
  }

  return newInsights;
}