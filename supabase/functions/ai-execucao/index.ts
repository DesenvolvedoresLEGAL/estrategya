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
    const { objective, okrs } = await req.json();
    
    if (!objective || !okrs) {
      throw new Error('Dados incompletos');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em execução estratégica usando a metodologia 4DX (4 Disciplinas da Execução) e WBR (Weekly Business Review).

Sua missão é criar um plano de execução semanal que permita à empresa alcançar seus objetivos estratégicos.

FOCO:
- Meta Crucialmente Importante (MCI) para as próximas 12 semanas
- 2 a 4 ações de alavanca semanais
- Placar visível (o que acompanhar toda semana)
- Cadência de responsabilidade (reunião WBR)`;

    const okrsText = okrs.okrs?.map((okr: any) => 
      `Objective: ${okr.objective}\nKRs: ${okr.key_results?.map((kr: any) => kr.kr).join(', ')}`
    ).join('\n\n');

    const userPrompt = `Com base no objetivo estratégico e OKRs abaixo, crie um plano de execução WBR/4DX.

OBJETIVO ESTRATÉGICO:
${objective}

OKRs:
${okrsText}

PRODUZA UMA RESPOSTA JSON com esta estrutura EXATA:
{
  "mci": "Meta Crucialmente Importante para as próximas 12 semanas. Deve ser específica, mensurável e derivada do objetivo central. Entre 10 e 20 palavras.",
  "acoes_semanais": [
    {
      "titulo": "Ação de alavanca 1",
      "descricao": "O que fazer especificamente esta semana para mover a MCI",
      "metrica_impacto": "Como medir o impacto dessa ação"
    }
  ],
  "placar": {
    "metricas": [
      {
        "nome": "Nome da métrica",
        "meta": "Meta semanal ou mensal",
        "frequencia": "semanal ou quinzenal"
      }
    ]
  },
  "cadencia": {
    "reuniao_tipo": "WBR - Weekly Business Review",
    "frequencia": "Toda segunda-feira às 9h (exemplo)",
    "duracao": "60 minutos",
    "participantes_sugeridos": "CEO, Diretores, Líderes de área",
    "pauta": "1. Review do placar da semana anterior\n2. Discussão de bloqueios\n3. Definição de ações para a próxima semana\n4. Alinhamento de prioridades"
  }
}

IMPORTANTE:
- A MCI deve ser alcançável em 12 semanas
- Gere de 2 a 4 ações de alavanca (ações que realmente movem a MCI)
- O placar deve ter de 3 a 5 métricas que são acompanhadas semanalmente
- A cadência deve ser semanal (WBR)
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

    console.log('Plano de execução gerado');

    return new Response(
      JSON.stringify(execucao),
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
