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
    const { company, diagnostico } = await req.json();
    
    if (!company || !diagnostico) {
      throw new Error('Dados incompletos');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um estrategista corporativo de classe mundial.
Sua missão é criar um OGSM (Objective, Goals, Strategies, Measures) enxuto e executável para empresas brasileiras.

REGRAS:
- Escreva em português do Brasil, de forma clara e inspiradora
- Use números e verbos de ação
- Foco em execução nos próximos 12 meses
- Zero teoria, só prática`;

    const userPrompt = `Com base no diagnóstico abaixo, crie um OGSM completo para a empresa.

EMPRESA: ${company.name}
SEGMENTO: ${company.segment}
DESAFIO: ${company.main_challenge}

DIAGNÓSTICO:
${diagnostico.leitura_executiva}

SWOT RESUMIDO:
Forças: ${diagnostico.swot_resumido?.forcas?.join(', ')}
Fraquezas: ${diagnostico.swot_resumido?.fraquezas?.join(', ')}
Oportunidades: ${diagnostico.swot_resumido?.oportunidades?.join(', ')}
Ameaças: ${diagnostico.swot_resumido?.ameacas?.join(', ')}

PRODUZA UMA RESPOSTA JSON com esta estrutura EXATA:
{
  "objective": "UM objetivo estratégico central para os próximos 12 meses. Deve ser inspirador, claro e conectado ao desafio principal. Entre 15 e 25 palavras.",
  "goals": [
    {
      "titulo": "Meta de negócio 1",
      "descricao": "Descrição da meta",
      "mensuravel": "Como medir (ex: aumentar receita recorrente de R$X para R$Y)"
    }
  ],
  "strategies": [
    {
      "goal_id": 0,
      "titulo": "Estratégia 1",
      "descricao": "Como a empresa vai alcançar essa meta. Deve refletir o SWOT/PESTEL"
    }
  ],
  "measures": [
    {
      "strategy_id": 0,
      "nome": "Nome da métrica",
      "o_que_medir": "Descrição do que será medido para saber se a estratégia está funcionando"
    }
  ]
}

IMPORTANTE:
- Gere de 3 a 5 goals mensuráveis
- Gere de 3 a 6 strategies que conectam aos goals
- Para cada strategy, defina 1 ou 2 measures
- Use goal_id e strategy_id como índices (0, 1, 2...) para criar relacionamentos
- Se a empresa quer crescer, priorize metas de aquisição, conversão, receita
- Se a empresa quer eficiência, priorize metas de produtividade, custo, SLA`;

    console.log('Gerando OGSM...');

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
    const ogsm = JSON.parse(content);

    console.log('OGSM gerado com sucesso');

    return new Response(
      JSON.stringify(ogsm),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar OGSM:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar OGSM' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
