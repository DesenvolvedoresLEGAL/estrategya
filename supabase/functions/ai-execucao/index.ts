import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { company, initiatives } = await req.json();
    
    if (!initiatives || initiatives.length === 0) {
      throw new Error('Iniciativas não fornecidas');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em execução estratégica usando a metodologia 4DX (4 Disciplinas da Execução) e WBR (Weekly Business Review).

Sua missão é criar um plano de execução semanal focado nas TOP 3 iniciativas priorizadas por ICE Score, usando os detalhes do 5W2H para tornar o plano concreto e executável.

FOCO:
- Meta Crucialmente Importante (MCI) para as próximas 12 semanas
- 2 a 4 ações de alavanca semanais (derivadas do "How" do 5W2H)
- Placar visível com métricas práticas
- Cadência de responsabilidade (reunião WBR)`;

    const initiativesText = initiatives.map((ini: any, i: number) => 
      `${i + 1}. ${ini.title} (ICE: ${ini.ice_score})
   Descrição: ${ini.description || 'Não informada'}
   Objetivo Estratégico: ${ini.objective || 'Não informado'}
   5W2H:
   - O que: ${ini.what || 'Não definido'}
   - Por que: ${ini.why || 'Não definido'}
   - Quem: ${ini.who || 'Não definido'}
   - Quando: ${ini.when_deadline || 'Não definido'}
   - Onde: ${ini.where_location || 'Não definido'}
   - Como: ${ini.how || 'Não definido'}
   - Quanto: R$ ${ini.how_much || 'Não definido'}`
    ).join('\n\n');

    const userPrompt = `Com base nas TOP 3 iniciativas com maior ICE Score abaixo, crie um plano de execução WBR/4DX para as próximas 12 semanas.

EMPRESA:
${company?.name || 'Não informada'} - ${company?.segment || 'Não informado'}

TOP 3 INICIATIVAS (por ICE Score):
${initiativesText}

PRODUZA UMA RESPOSTA JSON com esta estrutura EXATA:
{
  "mci": "Meta Crucialmente Importante para as próximas 12 semanas. Deve sintetizar as 3 iniciativas em uma meta única e mensurável. Entre 10 e 20 palavras.",
  "weekly_actions": [
    {
      "title": "Ação de alavanca 1 (baseada no 'How' do 5W2H)",
      "description": "O que fazer especificamente esta semana para mover a MCI",
      "owner": "Responsável (usar o 'Who' do 5W2H)",
      "impact_metric": "Como medir o impacto dessa ação"
    }
  ],
  "scoreboard": {
    "metrics": [
      {
        "name": "Nome da métrica",
        "target": "Meta semanal ou mensal (numérica e específica)",
        "frequency": "semanal"
      }
    ]
  },
  "review_cadence": {
    "meeting_type": "WBR - Weekly Business Review",
    "frequency": "Toda segunda-feira às 9h",
    "duration": "60 minutos",
    "suggested_participants": "CEO, Diretores, Líderes de área (usar 'Who' das iniciativas)",
    "agenda": "1. Review do placar da semana anterior\n2. Discussão de bloqueios\n3. Definição de ações para a próxima semana\n4. Alinhamento de prioridades"
  }
}

IMPORTANTE:
- Use os dados do 5W2H para tornar tudo mais concreto
- As weekly_actions devem derivar do "How" de cada iniciativa
- Os owners devem vir do "Who" das iniciativas
- A MCI deve sintetizar as 3 iniciativas em uma meta única
- O placar deve ter de 3 a 5 métricas mensuráveis
- Seja específico e executável`;

    console.log('Gerando plano de execução...');

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
    const execucao = JSON.parse(content);

    // Mapear para formato compatível com banco (manter retrocompatibilidade)
    const mappedExecution = {
      mci: execucao.mci,
      weekly_actions: execucao.weekly_actions || execucao.acoes_semanais || [],
      scoreboard: execucao.scoreboard || execucao.placar || { metrics: [] },
      review_cadence: execucao.review_cadence || execucao.cadencia || {}
    };

    console.log('Plano de execução gerado');

    return new Response(
      JSON.stringify(mappedExecution),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar plano de execução:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar plano de execução' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
