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

    const systemPrompt = `Você é um estrategista corporativo de classe mundial. Receberá o contexto de uma empresa (segmento, modelo de negócio, desafio principal) e um diagnóstico SWOT (forças, fraquezas, oportunidades, ameaças).
Com base nisso, produza:

1. Uma leitura executiva curta (5 a 8 linhas) explicando o momento da empresa.
2. Entre 4 e 6 linhas estratégicas possíveis que a empresa pode seguir nos próximos 12 meses.
3. Para cada linha estratégica, indique em quais perspectivas do Balanced Scorecard ela mais impacta (Finanças, Clientes, Processos Internos, Aprendizado & Crescimento).

Use linguagem simples, direta e voltada para dono de empresa brasileiro.
Use as melhores práticas de OKR, OGSM e BSC, mas não precisa citar o nome dos frameworks.

Retorne em JSON com a estrutura:
{
  "leitura_executiva": "texto aqui",
  "linhas_estrategicas": [
    {
      "titulo": "Nome da linha estratégica",
      "perspectivas": ["financeira", "clientes"]
    }
  ]
}`;

    const userPrompt = `Empresa: ${company.name}
Segmento: ${company.segment}
Modelo: ${company.model}
Tamanho do time: ${company.size_team} pessoas
Região: ${company.region}
Principal desafio: ${company.main_challenge}

SWOT:
Forças: ${swot.strengths?.join(', ') || 'Não informado'}
Fraquezas: ${swot.weaknesses?.join(', ') || 'Não informado'}
Oportunidades: ${swot.opportunities?.join(', ') || 'Não informado'}
Ameaças: ${swot.threats?.join(', ') || 'Não informado'}

Gere a análise estratégica.`;

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
