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
    const { initiatives } = await req.json();
    
    if (!initiatives || !Array.isArray(initiatives)) {
      throw new Error('Lista de iniciativas não fornecida');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em priorização estratégica usando a Matriz Impacto x Esforço.
Sua missão é classificar iniciativas em 4 quadrantes:
1. Fazer Agora (alto impacto, baixo esforço) - prioridade máxima
2. Planejar (alto impacto, alto esforço) - importante mas precisa de preparação
3. Oportunidades Rápidas (médio impacto, baixo esforço) - ganhos rápidos
4. Evitar ou Deixar para Depois (baixo impacto) - não vale a pena agora`;

    const initiativesText = initiatives.map((ini: any, i: number) => 
      `${i + 1}. ${ini.title}\n   Descrição: ${ini.description || 'Não informada'}\n   Impacto atual: ${ini.impact || 'não definido'}\n   Esforço atual: ${ini.effort || 'não definido'}`
    ).join('\n\n');

    const userPrompt = `Analise e classifique as iniciativas abaixo na Matriz Impacto x Esforço.

INICIATIVAS:
${initiativesText}

PRODUZA UMA RESPOSTA JSON com esta estrutura EXATA:
{
  "fazer_agora": [
    {
      "initiative_index": 0,
      "titulo": "Nome da iniciativa",
      "impacto": "alto",
      "esforco": "baixo",
      "impact_score": 9,
      "ease_score": 8,
      "justificativa": "Por que fazer agora (1 linha)"
    }
  ],
  "planejar": [
    {
      "initiative_index": 1,
      "titulo": "Nome",
      "impacto": "alto",
      "esforco": "alto",
      "impact_score": 9,
      "ease_score": 3,
      "justificativa": "Por que planejar (1 linha)"
    }
  ],
  "oportunidades_rapidas": [
    {
      "initiative_index": 2,
      "titulo": "Nome",
      "impacto": "medio",
      "esforco": "baixo",
      "impact_score": 6,
      "ease_score": 8,
      "justificativa": "Ganho rápido (1 linha)"
    }
  ],
  "evitar": [
    {
      "initiative_index": 3,
      "titulo": "Nome",
      "impacto": "baixo",
      "esforco": "alto ou medio",
      "impact_score": 3,
      "ease_score": 4,
      "justificativa": "Por que evitar (1 linha)"
    }
  ]
}

IMPORTANTE:
- Classifique TODAS as iniciativas
- Use initiative_index como índice da iniciativa na lista original (0, 1, 2...)
- Impacto pode ser: alto, medio, baixo
- Esforço pode ser: alto, medio, baixo
- impact_score: avalie o impacto real no objetivo (1-10, quanto maior melhor)
- ease_score: avalie a facilidade de execução (1-10, quanto maior mais fácil, inverso do esforço)
- Priorize iniciativas de alto impacto e baixo esforço
- Dentro de cada quadrante, ordene por prioridade (mais importante primeiro)`;

    console.log('Classificando iniciativas...');

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
    const priorizacao = JSON.parse(content);

    console.log('Priorização concluída');

    return new Response(
      JSON.stringify(priorizacao),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao priorizar iniciativas:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao priorizar iniciativas' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
