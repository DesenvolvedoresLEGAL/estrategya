import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { objectives } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating metrics for objectives');

    const systemPrompt = `Você receberá uma lista de Objetivos Estratégicos de uma empresa.
Para cada objetivo, sugira de 2 a 4 métricas/KRs que permitam medir o progresso.

Sempre que o objetivo for de crescimento, sugira métricas como: Receita mensal, Nº de clientes ativos, Ticket médio, CAC, Taxa de recompra.
Sempre que o objetivo for de eficiência, sugira métricas como: Tempo de atendimento, SLA, Nº de retrabalhos, Custo operacional.
Sempre que o objetivo envolver cliente, sugira métricas como: NPS, CSAT, Tempo de ativação, Nº de chamados.

Devolva a resposta estruturada por objetivo em JSON:
{
  "metricas_por_objetivo": {
    "objetivo_id_ou_titulo": [
      {
        "nome": "Nome da métrica",
        "meta": "Valor alvo sugerido",
        "periodo": "mensal" ou "trimestral" ou "anual"
      }
    ]
  }
}

Linguagem simples. Não explique o que é KPI, apenas liste.`;

    const objectivesText = objectives.map((obj: any, idx: number) => 
      `${idx + 1}. ${obj.titulo} (${obj.perspectiva})`
    ).join('\n');

    const userPrompt = `Objetivos Estratégicos:
${objectivesText}

Gere as métricas para cada objetivo.`;

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
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos no workspace Lovable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    console.log('Metrics generated successfully');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-indicadores:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar indicadores' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
