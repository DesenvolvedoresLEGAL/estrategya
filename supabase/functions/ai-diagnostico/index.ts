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
    const { company, swot } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating strategic diagnosis for:', company.name);

    const systemPrompt = `Você é um estrategista corporativo de classe mundial, atuando como Chief Strategy Officer de uma big tech.
Sua missão é analisar o diagnóstico SWOT de uma empresa brasileira e produzir uma análise estratégica executiva.

IMPORTANTE: Escreva em português do Brasil, de forma clara e direta para donos de negócio e líderes.
Use números, verbos de ação e zero teoria. Foco em execução.`;

    const userPrompt = `Analise a empresa e produza um diagnóstico estratégico completo.

DADOS DA EMPRESA:
Nome: ${company.name}
Segmento: ${company.segment}
Modelo de negócio: ${company.model}
Região: ${company.region || 'Brasil'}
Desafio principal: ${company.main_challenge}
Tamanho do time: ${company.size_team || 'não informado'}

ANÁLISE SWOT:
Forças: ${swot.strengths?.join(', ') || 'não informadas'}
Fraquezas: ${swot.weaknesses?.join(', ') || 'não informadas'}
Oportunidades: ${swot.opportunities?.join(', ') || 'não informadas'}
Ameaças: ${swot.threats?.join(', ') || 'não informadas'}

PRODUZA UMA RESPOSTA JSON com esta estrutura EXATA:
{
  "leitura_executiva": "Texto de até 8 linhas explicando o momento atual da empresa, seu contexto competitivo e as principais forças que impactam seu futuro nos próximos 12 meses. Seja direto e executivo.",
  "swot_resumido": {
    "forcas": ["item 1", "item 2", "item 3", "item 4"],
    "fraquezas": ["item 1", "item 2", "item 3", "item 4"],
    "oportunidades": ["item 1", "item 2", "item 3", "item 4"],
    "ameacas": ["item 1", "item 2", "item 3", "item 4"]
  },
  "pestel": {
    "politico": "Texto sobre fatores políticos QUE REALMENTE IMPACTAM o segmento. Se não houver impacto relevante, retorne null",
    "economico": "Texto sobre fatores econômicos relevantes ao segmento. Se não houver, retorne null",
    "social": "Texto sobre fatores sociais/comportamentais relevantes. Se não houver, retorne null",
    "tecnologico": "Texto sobre fatores tecnológicos relevantes. Se não houver, retorne null",
    "ambiental": "Texto sobre fatores ambientais/sustentabilidade relevantes. Se não houver, retorne null",
    "legal": "Texto sobre fatores legais/regulatórios relevantes. Se não houver, retorne null"
  }
}

REGRAS:
- Se não houver fator PESTEL relevante para uma dimensão, use null
- Mantenha cada item do SWOT resumido com no máximo 10 palavras
- A leitura executiva deve ter entre 6 e 8 linhas
- Use linguagem executiva, números quando possível
- Foco no que afeta os próximos 12 meses`;

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

    console.log('Diagnosis generated successfully');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-diagnostico:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar diagnóstico' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
