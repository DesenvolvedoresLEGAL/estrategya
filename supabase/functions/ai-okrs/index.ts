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
    const { company, goals } = await req.json();
    
    if (!company || !goals) {
      throw new Error('Dados incompletos');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em OKRs (Objectives and Key Results).
Sua missão é transformar Goals de um OGSM em OKRs executáveis para empresas brasileiras.

REGRAS:
- Cada Goal vira 1 Objective qualitativo, claro e alinhado
- Para cada Objective, gere 3 a 5 Key Results NUMÉRICOS e verificáveis
- Use métricas de negócio reais: MRR, CAC, LTV, churn, NPS, conversão, etc.
- Português do Brasil, linguagem executiva`;

    const goalsText = goals.map((g: any, i: number) => 
      `Goal ${i + 1}: ${g.titulo}\n${g.descricao}\nMensurável: ${g.mensuravel}`
    ).join('\n\n');

    const userPrompt = `Transforme os Goals abaixo em OKRs para a empresa ${company.name} (${company.segment}).

GOALS DO OGSM:
${goalsText}

PRODUZA UMA RESPOSTA JSON com esta estrutura EXATA:
{
  "okrs": [
    {
      "goal_index": 0,
      "objective": "Objective qualitativo conectado ao Goal 1. Inspirador e claro.",
      "key_results": [
        {
          "kr": "Aumentar MRR de R$X para R$Y",
          "target": "R$Y",
          "metrica": "MRR"
        },
        {
          "kr": "Reduzir CAC de R$A para R$B",
          "target": "R$B",
          "metrica": "CAC"
        }
      ]
    }
  ]
}

IMPORTANTE:
- Gere 1 OKR para cada Goal
- Cada OKR deve ter de 3 a 5 Key Results
- Key Results devem ser NUMÉRICOS e verificáveis
- Use métricas de negócio reais (receita, leads, conversão, NPS, tempo, custo, etc.)
- Se a empresa quer crescer, priorize KRs de aquisição e conversão
- Se a empresa quer eficiência, priorize KRs de produtividade e custo`;

    console.log('Gerando OKRs...');

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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao seu workspace Lovable.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const okrs = JSON.parse(content);

    console.log('OKRs gerados com sucesso');

    return new Response(
      JSON.stringify(okrs),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar OKRs:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar OKRs' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
