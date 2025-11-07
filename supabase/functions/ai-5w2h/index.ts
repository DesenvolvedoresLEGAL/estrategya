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
    const { initiative, objective, company } = await req.json();
    
    if (!initiative) {
      throw new Error('Dados da iniciativa não fornecidos');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em planejamento estratégico e metodologia 5W2H.
Sua missão é transformar iniciativas estratégicas em planos de ação concretos e executáveis.

A metodologia 5W2H responde:
- What (O que): Descrição clara e específica da ação
- Why (Por que): Justificativa estratégica e impacto esperado
- Who (Quem): Responsável pela execução (cargo/área)
- When (Quando): Prazo realista (considere a complexidade)
- Where (Onde): Local/contexto de execução
- How (Como): Passos detalhados de execução
- How much (Quanto): Estimativa de investimento necessário`;

    const userPrompt = `Crie um plano 5W2H detalhado para a seguinte iniciativa:

INICIATIVA: ${initiative.title}
DESCRIÇÃO: ${initiative.description || 'Não informada'}
OBJETIVO ESTRATÉGICO: ${objective?.title || 'Não informado'}
EMPRESA: ${company?.name || 'Não informada'}
SEGMENTO: ${company?.segment || 'Não informado'}

RETORNE UM JSON com esta estrutura EXATA:
{
  "what": "Descrição clara e específica do que será feito (2-3 frases)",
  "why": "Por que essa iniciativa é importante para o objetivo estratégico (2-3 frases explicando o vínculo)",
  "who": "Quem deve ser responsável (cargo/área específica, ex: 'Gerente de Marketing' ou 'Equipe de Vendas')",
  "when": "Prazo sugerido em dias corridos (apenas o número, ex: 30, 60, 90)",
  "where": "Onde será executado (ex: 'Online - Redes Sociais', 'Presencial - Loja Física', 'Sistema CRM')",
  "how": "Como executar - passos principais (lista com 3-5 etapas práticas e sequenciais)",
  "how_much": "Estimativa de investimento em reais (apenas o número, ex: 5000, 15000)"
}

IMPORTANTE:
- Seja específico e prático
- When: retorne apenas número de dias (30, 60, 90, etc)
- How much: retorne apenas número em reais
- How: liste 3-5 passos claros e executáveis
- Considere o segmento e porte da empresa
- Foque em ações concretas, não abstratas`;

    console.log('Gerando 5W2H para iniciativa:', initiative.title);

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
    const fiveW2H = JSON.parse(content);

    console.log('5W2H gerado com sucesso');

    return new Response(
      JSON.stringify(fiveW2H),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar 5W2H:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar 5W2H' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
