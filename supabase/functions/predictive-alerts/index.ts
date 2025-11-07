import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictiveAlert {
  company_id: string;
  insight_type: 'risco' | 'oportunidade' | 'recomendacao';
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { companyId } = await req.json();

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const alerts = await generatePredictiveAlerts(companyId, supabaseClient);

    return new Response(JSON.stringify({ 
      success: true, 
      alerts_generated: alerts.length,
      alerts 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating predictive alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generatePredictiveAlerts(companyId: string, supabase: any) {
  const alerts: PredictiveAlert[] = [];

  // 1. Predição de Probabilidade de Atingir Meta
  const { data: objectives } = await supabase
    .from('strategic_objectives')
    .select(`
      *,
      metrics (
        id,
        name,
        current_value,
        target,
        period,
        metric_updates (
          value,
          recorded_at
        )
      ),
      initiatives (
        id,
        title,
        status,
        due_date
      )
    `)
    .eq('company_id', companyId);

  for (const objective of objectives || []) {
    for (const metric of objective.metrics || []) {
      if (!metric.current_value || !metric.target || !metric.metric_updates) continue;

      try {
        const updates = metric.metric_updates
          .sort((a: any, b: any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

        if (updates.length < 2) continue;

        // Calcular taxa de progresso (simple linear regression)
        const values = updates.map((u: any) => parseFloat(u.value)).filter((v: number) => !isNaN(v));
        if (values.length < 2) continue;

        const target = parseFloat(metric.target);
        const currentValue = parseFloat(metric.current_value);
        
        if (isNaN(target) || isNaN(currentValue)) continue;

        // Calcular velocidade média de progresso
        const firstValue = values[0];
        const lastValue = values[values.length - 1];
        const progressRate = (lastValue - firstValue) / values.length;

        // Estimar progresso futuro
        const remainingToTarget = target - currentValue;
        const periodsNeeded = remainingToTarget / progressRate;

        // Prever probabilidade
        let probability = 0;
        let alertPriority: 'baixa' | 'media' | 'alta' = 'media';
        
        if (progressRate <= 0) {
          probability = 10; // Sem progresso ou regredindo
          alertPriority = 'alta';
        } else if (periodsNeeded <= 2) {
          probability = 90; // Muito provável
          alertPriority = 'baixa';
        } else if (periodsNeeded <= 5) {
          probability = 65; // Provável
          alertPriority = 'media';
        } else if (periodsNeeded <= 10) {
          probability = 40; // Improvável
          alertPriority = 'media';
        } else {
          probability = 15; // Muito improvável
          alertPriority = 'alta';
        }

        if (probability < 50) {
          alerts.push({
            company_id: companyId,
            insight_type: 'risco',
            priority: alertPriority,
            title: `Risco de não atingir meta: "${metric.name}"`,
            description: `Probabilidade estimada de atingir a meta: ${probability}%. Taxa de progresso atual: ${progressRate.toFixed(2)} por período. Recomenda-se acelerar as ações ou revisar a meta.`,
            related_objective_id: objective.id,
            status: 'novo',
          });
        } else if (probability >= 80) {
          alerts.push({
            company_id: companyId,
            insight_type: 'oportunidade',
            priority: 'baixa',
            title: `Alta probabilidade de sucesso: "${metric.name}"`,
            description: `Probabilidade estimada de atingir a meta: ${probability}%. Continue com o ritmo atual de progresso!`,
            related_objective_id: objective.id,
            status: 'novo',
          });
        }
      } catch (e) {
        console.error('Error processing metric:', e);
        continue;
      }
    }

    // 2. Predição de Risco de Atraso em Iniciativas
    const today = new Date();
    
    for (const initiative of objective.initiatives || []) {
      if (!initiative.due_date || initiative.status === 'concluída') continue;

      const dueDate = new Date(initiative.due_date);
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Calcular risco baseado em status e prazo
      let riskScore = 0;
      
      if (initiative.status === 'não iniciada' || initiative.status === 'em_planejamento') {
        if (daysUntilDue <= 7) {
          riskScore = 90; // Alto risco
        } else if (daysUntilDue <= 14) {
          riskScore = 70; // Risco médio-alto
        } else if (daysUntilDue <= 30) {
          riskScore = 50; // Risco moderado
        } else {
          riskScore = 20; // Baixo risco
        }
      } else if (initiative.status === 'em_progresso') {
        if (daysUntilDue <= 7) {
          riskScore = 60; // Risco médio
        } else if (daysUntilDue <= 14) {
          riskScore = 40; // Risco baixo-médio
        } else {
          riskScore = 15; // Baixo risco
        }
      }

      if (riskScore >= 60) {
        alerts.push({
          company_id: companyId,
          insight_type: 'risco',
          priority: 'alta',
          title: `Alto risco de atraso: "${initiative.title}"`,
          description: `Risco estimado: ${riskScore}%. Faltam ${daysUntilDue} dias para o prazo e a iniciativa está em status "${initiative.status}". Recomenda-se ação imediata.`,
          related_objective_id: objective.id,
          status: 'novo',
        });
      } else if (riskScore >= 40) {
        alerts.push({
          company_id: companyId,
          insight_type: 'risco',
          priority: 'media',
          title: `Atenção necessária: "${initiative.title}"`,
          description: `Risco estimado: ${riskScore}%. Faltam ${daysUntilDue} dias para o prazo. Monitore o progresso de perto.`,
          related_objective_id: objective.id,
          status: 'novo',
        });
      }
    }
  }

  // 3. Predição de Necessidade de Recursos Adicionais
  const { data: allInitiatives } = await supabase
    .from('initiatives')
    .select('*, objective:strategic_objectives!inner(company_id, title)')
    .eq('objective.company_id', companyId)
    .in('status', ['em_progresso', 'atrasada']);

  // Agrupar por objetivo
  const initiativesByObjective: Record<string, any[]> = {};
  allInitiatives?.forEach((initiative: any) => {
    const objId = initiative.objective_id;
    if (!initiativesByObjective[objId]) {
      initiativesByObjective[objId] = [];
    }
    initiativesByObjective[objId].push(initiative);
  });

  for (const [objectiveId, initiatives] of Object.entries(initiativesByObjective)) {
    if (initiatives.length >= 5) {
      const objective = initiatives[0].objective;
      alerts.push({
        company_id: companyId,
        insight_type: 'recomendacao',
        priority: 'media',
        title: `Múltiplas iniciativas simultâneas em "${objective.title}"`,
        description: `${initiatives.length} iniciativas estão em progresso simultaneamente. Considere priorizar ou alocar recursos adicionais para evitar sobrecarga.`,
        related_objective_id: objectiveId,
        status: 'novo',
      });
    }
  }

  // 4. Análise de Tendências de Métricas (detectar declínio)
  const { data: metricsWithHistory } = await supabase
    .from('metrics')
    .select(`
      *,
      objective:strategic_objectives!inner(company_id),
      metric_updates (
        value,
        recorded_at
      )
    `)
    .eq('objective.company_id', companyId);

  for (const metric of metricsWithHistory || []) {
    if (!metric.metric_updates || metric.metric_updates.length < 3) continue;

    try {
      const updates = metric.metric_updates
        .sort((a: any, b: any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        .slice(-3); // Últimas 3 medições

      const values = updates.map((u: any) => parseFloat(u.value)).filter((v: number) => !isNaN(v));
      if (values.length < 3) continue;

      // Detectar tendência de declínio
      const isDecreasing = values[2] < values[1] && values[1] < values[0];
      const decreaseRate = ((values[0] - values[2]) / values[0]) * 100;

      if (isDecreasing && decreaseRate > 10) {
        alerts.push({
          company_id: companyId,
          insight_type: 'risco',
          priority: 'alta',
          title: `Tendência de declínio detectada: "${metric.name}"`,
          description: `A métrica apresentou queda de ${decreaseRate.toFixed(1)}% nas últimas 3 medições. Investigue as causas e tome ações corretivas.`,
          related_objective_id: metric.objective_id,
          status: 'novo',
        });
      }
    } catch (e) {
      console.error('Error analyzing metric trend:', e);
      continue;
    }
  }

  // Remover alertas duplicados recentes (últimas 24 horas)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data: recentAlerts } = await supabase
    .from('ai_insights')
    .select('title')
    .eq('company_id', companyId)
    .gte('created_at', yesterday.toISOString());

  const existingTitles = new Set(recentAlerts?.map((a: any) => a.title) || []);
  const newAlerts = alerts.filter(a => !existingTitles.has(a.title));

  // Salvar novos alertas
  if (newAlerts.length > 0) {
    const { error: insertError } = await supabase
      .from('ai_insights')
      .insert(newAlerts);

    if (insertError) {
      console.error('Error inserting alerts:', insertError);
    } else {
      console.log(`Generated ${newAlerts.length} predictive alerts for company ${companyId}`);
    }
  }

  return newAlerts;
}