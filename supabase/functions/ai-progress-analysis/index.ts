import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProgressInsight {
  type: 'progresso' | 'risco' | 'oportunidade' | 'recomendacao';
  title: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  related_objective_id?: string;
}

interface Recommendation {
  action: string;
  reason: string;
  expected_impact: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, objectives, metrics, metric_updates } = await req.json();
    
    console.log(`Analyzing progress for company: ${company_id}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context from data
    const objectivesContext = objectives.map((obj: any) => ({
      id: obj.id,
      title: obj.title,
      description: obj.description,
      perspective: obj.perspective,
      priority: obj.priority,
      current_status: obj.latest_update?.status || 'nao_iniciado',
      progress: obj.latest_update?.progress_percentage || 0,
      initiatives_count: obj.initiatives?.length || 0
    }));

    const metricsContext = metrics.map((m: any) => ({
      name: m.name,
      current_value: m.current_value,
      target: m.target,
      objective: m.objective_title,
      last_updates: metric_updates
        .filter((u: any) => u.metric_id === m.id)
        .slice(0, 5)
        .map((u: any) => ({ value: u.value, date: u.recorded_at }))
    }));

    const systemPrompt = `Você é um consultor estratégico especializado em análise de performance e gestão de objetivos.

Sua tarefa é analisar o progresso estratégico de uma empresa e gerar insights ACIONÁVEIS e ESPECÍFICOS.

REGRAS:
1. Seja DIRETO e PRÁTICO - evite generalidades
2. Identifique RISCOS REAIS baseado nos dados
3. Sugira OPORTUNIDADES concretas
4. Priorize insights por IMPACTO e URGÊNCIA
5. Relacione insights a objetivos específicos quando possível

TIPOS DE INSIGHTS:
- "progresso": Avanços positivos e conquistas
- "risco": Alertas sobre objetivos em atraso ou métricas fora do alvo
- "oportunidade": Chances de melhorar ou acelerar resultados
- "recomendacao": Ações específicas a tomar

PRIORIDADES:
- "critica": Requer ação imediata
- "alta": Muito importante, agir em breve
- "media": Importante, planejar ação
- "baixa": Acompanhar

Retorne APENAS um JSON válido no formato:
{
  "overall_health": "saudavel" | "atencao" | "critico",
  "score": 0-100,
  "insights": [
    {
      "type": "risco" | "progresso" | "oportunidade" | "recomendacao",
      "title": "Título curto e direto",
      "description": "Descrição específica com dados concretos",
      "priority": "critica" | "alta" | "media" | "baixa",
      "related_objective_id": "uuid ou null"
    }
  ],
  "recommendations": [
    {
      "action": "Ação específica a tomar",
      "reason": "Por que é importante",
      "expected_impact": "Resultado esperado"
    }
  ]
}`;

    const userPrompt = `Analise o progresso estratégico desta empresa:

OBJETIVOS ESTRATÉGICOS:
${JSON.stringify(objectivesContext, null, 2)}

MÉTRICAS E EVOLUÇÃO:
${JSON.stringify(metricsContext, null, 2)}

Gere uma análise completa com:
1. Avaliação geral de saúde (score 0-100)
2. 3-7 insights específicos priorizados
3. 3-5 recomendações práticas

Seja crítico e realista. Identifique problemas reais e sugira ações concretas.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits. Please add credits to continue.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    console.log('Progress analysis generated successfully');

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-progress-analysis:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
